# Phase 2: Extraction Engine — Injectable Scripts + Playwright Extractors

**Model**: Opus (deep reasoning needed for complex browser JS)
**Branch**: `feat/extractors`
**Estimated time**: 60 minutes
**Dependencies**: Phase 1 must be merged to main

## Objective

Build the core extraction engine — 9 browser-injectable JavaScript scripts and their corresponding Playwright extractor wrappers. This is the heart of designmaxxing. Every script must be battle-tested against real-world page complexity: shadow DOM, CSS-in-JS, cross-origin stylesheets, SPAs, lazy-loaded content.

## Pre-flight

```bash
git checkout main && git pull
git checkout -b feat/extractors
npm install
```

## Architecture Recap

```
src/scripts/extract-*.js    → Pure JS, injected into target page via page.evaluate()
                               Returns structured JSON matching types in src/types/extraction.ts
src/extractors/*.ts          → Playwright wrappers that inject scripts, handle breakpoints,
                               manage interaction states, download assets, write results
src/extractors/orchestrator.ts → Runs all extractors, manages browser lifecycle
```

## Step 1: Injectable Scripts (`src/scripts/`)

CRITICAL: These run inside the TARGET PAGE's browser context. They have access to `document`, `window`, `getComputedStyle()` — but NOT Node.js, NOT Playwright APIs. They must be self-contained, zero-dependency JavaScript. Each script must define a `__extract(args)` function.

### 1.1 `src/scripts/extract-styles.js`

Bulk computed style extraction. Walk every element in a container (or `document.body`), capture computed styles.

```javascript
function __extract(args) {
  const root = args?.selector ? document.querySelector(args.selector) : document.body
  if (!root) return { styles: [], error: 'Root element not found' }

  const maxDepth = args?.maxDepth ?? 20
  const results = []

  function getPath(el) {
    const parts = []
    let current = el
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()
      if (current.id) selector += '#' + current.id
      else if (current.className && typeof current.className === 'string') {
        const cls = current.className.trim().split(/\s+/).slice(0, 2).join('.')
        if (cls) selector += '.' + cls
      }
      parts.unshift(selector)
      current = current.parentElement
    }
    return parts.join(' > ')
  }

  function walk(el, depth) {
    if (depth > maxDepth) return
    const cs = getComputedStyle(el)
    const rect = el.getBoundingClientRect()

    results.push({
      selector: {
        tag: el.tagName.toLowerCase(),
        classes: typeof el.className === 'string' ? el.className : '',
        id: el.id || '',
        depth,
        path: getPath(el),
      },
      display: cs.display,
      position: cs.position,
      width: cs.width,
      height: cs.height,
      margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
      padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
      gap: cs.gap,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      boxShadow: cs.boxShadow,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      overflow: cs.overflow,
      textTransform: cs.textTransform,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    })

    for (const child of el.children) {
      walk(child, depth + 1)
    }
  }

  walk(root, 0)
  return { styles: results, count: results.length }
}
```

### 1.2 `src/scripts/extract-colors.js`

Extract every unique color from computed styles across the page. Deduplicate and count usage.

Key logic:
- Scan all elements for: `color`, `backgroundColor`, `borderTopColor`, `borderRightColor`, `borderBottomColor`, `borderLeftColor`, `outlineColor`
- Parse `boxShadow` values to extract shadow colors
- Filter out `transparent` and `rgba(0, 0, 0, 0)`
- Convert all values to hex for dedup
- Return sorted by usage count (descending)
- Include which CSS properties and sample element selectors use each color

### 1.3 `src/scripts/extract-typography.js`

Extract the typography system:
- Scan all elements containing text (`el.textContent.trim().length > 0`)
- For each, capture: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform
- Deduplicate by compound key (all properties joined)
- Count usage of each unique combination
- Also extract `@font-face` rules from all stylesheets (try/catch for cross-origin)
- Detect font-display strategy
- Return: type scale + font-face declarations

### 1.4 `src/scripts/extract-layout.js`

Detect all flex and grid containers:
- Scan every element, check if `display` includes 'flex' or 'grid'
- For flex: capture direction, wrap, justify, align, gap
- For grid: capture template-columns, template-rows, gap, areas
- Build a tree showing nesting of layout containers
- Find max-width containers (elements with max-width between 500-2000px and auto margins)
- Extract media queries from all stylesheets
- Return: layout tree, container hierarchy, breakpoints

### 1.5 `src/scripts/extract-components.js`

Detect component boundaries:
- Check for React fiber keys on elements (`__reactFiber$*`, `__reactInternalInstance$*`)
- Check for Vue markers (`__vue__`, `data-v-*` attributes)
- Check for Svelte hashed classes (`svelte-*`)
- Check for Angular `_ngcontent-*` attributes
- Check for `data-testid`, `data-component`, `data-slot` attributes
- Fall back to heuristic: find repeated DOM patterns (same tag + class structure appearing 3+ times)
- For each component boundary, capture the outer element's computed styles
- Return: component entries with names inferred from classes/data-attributes

### 1.6 `src/scripts/extract-assets.js`

Inventory all visual assets:
- All `<img>` elements: src, srcset, sizes, naturalWidth, naturalHeight, loading, alt
- All `<svg>` elements: viewBox, width, height, path d-attributes, parent context
- All `<svg><use>` sprite references
- Background images from computed styles: scan all elements for `backgroundImage !== 'none'`
- Picture/source elements for responsive images
- Return: categorized asset list with download URLs

### 1.7 `src/scripts/extract-animations.js`

Capture all CSS animations and transitions:
- Scan all elements for `transition` (filter out default `all 0s ease 0s`)
- Parse transition values into: property, duration, timing-function, delay
- Extract `@keyframes` from stylesheets: name, keyframe stops, styles per stop
- Scan for `animationName`, `animationDuration`, `animationTimingFunction`
- Return: transition registry + keyframe definitions

### 1.8 `src/scripts/extract-behavior.js`

Map interactive behaviors:
- Detect elements with `position: sticky` or `position: fixed` (scroll behaviors)
- Detect `overflow: auto/scroll` containers
- Detect `scroll-snap-type` containers
- Map form elements with validation attributes: required, pattern, min/max, minlength/maxlength, type
- Check for `scroll-behavior: smooth` on html/body
- Return: scroll behaviors, form validation specs

NOTE: `getEventListeners()` is only available via Chrome DevTools Protocol, not `page.evaluate()`. The Playwright extractor wrapper (Step 2) will use CDP for this.

### 1.9 `src/scripts/detect-framework.js`

Detect the tech stack — this is the most comprehensive script:

**Frameworks to detect:**
- Next.js: `window.__NEXT_DATA__`, `#__next`, meta generator
- Nuxt: `window.__NUXT__`, `#__nuxt`
- React: `[data-reactroot]`, React fiber on body, `_reactRootContainer`
- Vue: `[data-v-]`, `window.__VUE_DEVTOOLS_GLOBAL_HOOK__`, `__vue__` on elements
- Angular: `[ng-version]`, `window.ng`
- Svelte: `[class*="svelte-"]`
- Remix: `window.__remixContext`
- Gatsby: `window.__GATSBY`
- Astro: `meta[name="generator"][content*="Astro"]`
- SvelteKit: `__sveltekit` in scripts

**CSS Methodology detection:**
- Tailwind: frequency analysis of utility classes (flex, p-, px-, bg-, text-, rounded-, shadow-, w-, h-). If 6+ patterns match with high frequency → Tailwind
- BEM: regex for `block__element--modifier` patterns
- CSS Modules: hashed class names matching `_name_hash` or `styles_name__hash`
- CSS-in-JS (Emotion): `css-` prefixed classes
- CSS-in-JS (styled-components): `sc-` prefixed classes
- Vanilla CSS: no detected methodology patterns

**Component Libraries:**
- MUI: `Mui*` class prefixes
- Chakra UI: `chakra-*` class prefixes
- Ant Design: `ant-*` class prefixes
- Radix UI: `[data-radix-*]` attributes
- shadcn/ui: `[data-slot]` attributes, combination of Radix + Tailwind
- Headless UI: `[data-headlessui-*]` attributes
- DaisyUI: `btn`, `card`, `navbar` classes + Tailwind

Return confidence scores (0-1) for each, along with the signals that triggered detection.

## Step 2: Playwright Extractor Classes (`src/extractors/`)

Replace every stub from Phase 1 with the real implementation.

### 2.1 `src/extractors/visual.ts`

```typescript
export class VisualExtractor extends BaseExtractor<VisualExtractionResult> {
  async extract(): Promise<VisualExtractionResult> {
    // 1. Inject extract-styles.js → get all computed styles
    // 2. Inject extract-colors.js → get color palette
    // 3. Deduplicate shadows and border-radii from style results
    // 4. For each breakpoint: resize viewport → re-inject styles script → store per-breakpoint data
    // 5. Return aggregated results
  }
}
```

### 2.2 `src/extractors/typography.ts`

- Inject extract-typography.js
- Additionally: intercept network requests to capture font file URLs (via `page.route('**/*.{woff,woff2,ttf,otf,eot}')`)
- Download font files to `output/assets/fonts/`

### 2.3 `src/extractors/layout.ts`

- Inject extract-layout.js
- For each breakpoint: resize → re-extract → store layout changes
- Result shows how layout transforms across breakpoints

### 2.4 `src/extractors/components.ts`

- Inject extract-components.js for boundary detection
- For each detected component: programmatically trigger hover, focus, active states using Playwright:
  ```typescript
  await element.hover() // capture hover state
  await element.focus() // capture focus state
  // Click and immediately capture active state via requestAnimationFrame
  ```
- Re-extract computed styles in each state
- Build component entry with all state variations

### 2.5 `src/extractors/assets.ts`

- Inject extract-assets.js for inventory
- Download images: `page.route('**/*.{png,jpg,jpeg,gif,webp,avif,svg}')` to intercept and save
- Download SVGs: extract innerHTML of inline `<svg>` elements and write to files
- Download fonts (shared with typography extractor)
- Track successes and failures

### 2.6 `src/extractors/animations.ts`

- Inject extract-animations.js
- No special Playwright orchestration needed (animations are declarative CSS)

### 2.7 `src/extractors/behavior.ts`

- Inject extract-behavior.js for scroll/form detection
- Use Chrome DevTools Protocol for event listener enumeration:
  ```typescript
  const cdp = await this.page.context().newCDPSession(this.page)
  // For each interactive element, get event listeners via CDP
  const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId })
  ```
- Merge CDP results with injected script results

### 2.8 `src/extractors/framework.ts`

- Inject detect-framework.js
- Simple wrapper — no special Playwright orchestration needed

### 2.9 `src/extractors/network.ts`

- Start HAR recording: `await context.tracing.start({ screenshots: false, snapshots: false })`
- Actually, use `page.route('**/*')` to intercept and log all XHR/Fetch requests
- Or use `context.routeFromHAR()` in recording mode
- Capture: method, URL, status, content-type, payload size
- Save HAR file to output
- Return endpoint summary

## Step 3: Orchestrator (`src/extractors/orchestrator.ts`)

Replace the stub with the real implementation:

```typescript
import { chromium } from 'playwright'

export async function extractAll(config: ExtractionConfig): Promise<ExtractionManifest> {
  // 1. Validate config with ConfigSchema
  // 2. Create output directory
  // 3. Launch browser (headless based on config)
  // 4. Create context with optional cookies
  // 5. Navigate to URL, wait for networkidle or waitForSelector
  // 6. Take full-page screenshots at each breakpoint
  // 7. For each enabled module:
  //    a. Instantiate the extractor
  //    b. Set the shared page
  //    c. Run extract()
  //    d. Write result JSON to output/<module>.json
  // 8. Generate ExtractionManifest linking all results
  // 9. Write manifest to output/extraction.json
  // 10. Close browser
  // 11. Return manifest
}
```

Key implementation details:
- Share a single browser instance across all extractors
- Navigate only once
- Reset viewport to default between extractors
- Handle errors per-extractor (one failing shouldn't kill the whole run)
- Use `ora` spinner for progress indication when called from CLI
- Support authentication via cookie injection from a JSON file

## Step 4: Script Loading

Create `src/extractors/script-loader.ts`:

Utility to load injectable scripts at runtime:
- Read `.js` files from `src/scripts/` (or `dist/scripts/` in production)
- Bundle them as strings for `page.evaluate()`
- Handle the path resolution correctly for both dev and npm-installed scenarios

Make sure `scripts/*.js` files are included in the npm package by adding them to the `files` field in `package.json` and copying them to `dist/scripts/` during build.

Add to `tsconfig.json` or `package.json` build script: copy `src/scripts/*.js` → `dist/scripts/*.js` (these are plain JS, not TypeScript, so `tsc` won't copy them).

## Step 5: Verify & Commit

```bash
npm run build  # must compile with zero errors
# Manual test against a real page:
npx tsx src/extractors/orchestrator.ts  # (add a quick test invocation)
```

```bash
git add -A
git commit -m "feat: extraction engine — 9 injectable scripts + Playwright extractors + orchestrator"
git push -u origin feat/extractors
```

## Completion Criteria

- [ ] All 9 injectable scripts are complete and syntactically valid JS
- [ ] All 9 extractor classes implement `extract()` (no more `throw new Error('Not implemented')`)
- [ ] Orchestrator runs all extractors and produces output JSON files
- [ ] `npm run build` passes with zero errors
- [ ] Script loader handles path resolution for both dev and packaged usage
- [ ] Error handling: one extractor failing doesn't crash the pipeline
- [ ] Font/image/SVG asset downloads work
- [ ] HAR capture works for network module
- [ ] CDP integration works for event listener enumeration in behavior module

## Quality Bar

This is the most critical phase. The extraction scripts must handle:
- Empty/missing elements gracefully (never throw)
- Cross-origin stylesheet restrictions (try/catch with fallback)
- Shadow DOM boundaries
- Dynamic/lazy-loaded content (rely on Playwright's networkidle wait)
- SVGs with complex path data (don't truncate)
- Inline styles alongside computed styles
- CSS custom properties (var() references)
- Very large pages (10,000+ elements) without hanging — consider batching
