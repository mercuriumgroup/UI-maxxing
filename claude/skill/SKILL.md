---
name: designmaxxing
description: "Pixel-perfect UI reverse engineering. Extract design tokens, components, layout, and assets from any web app. Usage: /designmaxxing <url>"
---

# designmaxxing — UI Reverse Engineering Toolkit

Extract design tokens, components, layout systems, typography, colors, assets, animations, and behaviors from any live web URL using Playwright browser automation.

## Usage

```
/designmaxxing <url>                                     # Full extraction (all modules)
/designmaxxing <url> --modules visual,typography,layout  # Specific modules only
/designmaxxing <url> --output ./my-extraction            # Custom output directory
/designmaxxing <url> --screenshots                       # Include multi-breakpoint screenshots
/designmaxxing <url> --wait-for-selector ".main-content" # Wait for SPA content
/designmaxxing <url> --auth-cookies cookies.txt          # Auth-gated pages
/designmaxxing reconstruct                               # Start guided UI reconstruction
/designmaxxing verify http://localhost:3000              # Compare rebuild vs original
/designmaxxing report                                    # Generate HTML report from last extraction
```

## Skill Logic

When invoked with a URL, execute the following steps:

### Step 1 — Parse Input

Extract from the user's message:
- **URL** (required): must start with `http://` or `https://`. If missing or malformed, ask the user to provide a valid URL before proceeding.
- **--modules**: comma-separated list (visual, typography, layout, components, assets, animations, behavior, framework, network). Default: all modules.
- **--output**: output directory path. Default: `./designmaxxing-output`.
- **--timeout**: page load timeout in ms. Default: 30000.
- **--wait-for-selector**: CSS selector to wait for before extracting.
- **--auth-cookies**: path to cookie file (Netscape format or JSON array).
- **--screenshots**: boolean flag to capture multi-breakpoint screenshots.

### Step 2 — Validate URL

Before spawning any agents:
1. Check that the URL begins with `http://` or `https://`
2. Check that it has a valid hostname (not just `localhost` without a port when doing comparison)
3. If the URL is invalid, stop and ask: "Please provide a valid http/https URL to extract from."

### Step 3 — Run Extraction

Spawn the `designmaxxing-extractor` agent with:
- The validated URL
- The modules list (or "all")
- The output directory
- Any additional flags (timeout, wait-for-selector, auth-cookies, screenshots)

Wait for the extractor to complete before proceeding.

### Step 4 — Run Analysis

After extraction completes successfully, spawn the `designmaxxing-analyzer` agent with:
- Path to the output directory
- Path to `extraction.json` manifest
- Framework detection results (from extractor summary)

The analyzer will generate:
- `tokens.json` — structured design tokens
- `tokens.css` — CSS custom properties
- `tailwind.config.ts` — Tailwind theme extension (if Tailwind detected)
- `analysis.md` — human-readable findings
- `component-inventory.json` — named component catalog

### Step 5 — Present Results

After both agents complete, summarize:

```
## Extraction Complete — <url>

### What Was Found
- **Colors**: N unique values → N semantic clusters
- **Typography**: N scale entries, N font families
- **Layout**: N flex containers, N grid containers, N breakpoints
- **Components**: N component boundaries detected
- **Assets**: N images, N SVGs, N fonts downloaded
- **Animations**: N transitions, N keyframe animations
- **Framework**: <detected stack>

### Key Findings
- Spacing base unit: Npx (N-unit scale)
- Type scale: <scale name or ratio>
- Design system patterns: <yes/no + details>
- Primary color: <hex>
- Body font: <family>

### Output Files
./designmaxxing-output/
  extraction.json      ← manifest
  tokens.json          ← design tokens
  tokens.css           ← CSS custom properties
  tailwind.config.ts   ← Tailwind extension (if applicable)
  analysis.md          ← full findings report
  component-inventory.json
  visual.json, typography.json, layout.json, ...
  assets/fonts/, assets/images/, assets/svgs/
  screenshots/375.png, 768.png, 1024.png, 1440.png
```

### Step 6 — Offer Next Steps

After presenting results, always offer:

```
**Next steps:**
- Run `/designmaxxing reconstruct` to start rebuilding from the extracted data
- Run `/designmaxxing verify http://localhost:3000` to compare your rebuild against the original
- Open `designmaxxing-output/analysis.md` for the full design system analysis
```

---

## Sub-commands

### `reconstruct`

Spawn the `designmaxxing-reconstructor` agent. It will:
1. Read the most recent extraction output (or ask for the path)
2. Detect the user's current project stack from their `package.json`
3. Generate foundation files (tokens, global styles, layout shell)
4. Build components bottom-up following the master reconstruction checklist
5. Reference extracted screenshots for visual verification at each step

### `verify <rebuild-url>`

Spawn the `designmaxxing-verifier` agent with:
- The original URL (from `extraction.json` manifest, or ask user)
- The rebuild URL provided

The verifier captures screenshots at 375, 768, 1024, 1440px widths, computes pixel diffs, and produces a prioritized issue report.

### `report`

Read the most recent extraction output directory and generate a human-readable HTML report summarizing all findings. Write to `designmaxxing-output/report.html`.

---

## CLI Flags Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--modules <list>` | all | Comma-separated modules to run |
| `--output <dir>` | `./designmaxxing-output` | Output directory |
| `--timeout <ms>` | 30000 | Page load timeout |
| `--wait-for-selector <css>` | — | Wait for selector before extracting |
| `--auth-cookies <file>` | — | Netscape or JSON cookie file |
| `--screenshots` | false | Capture multi-breakpoint screenshots |
| `--viewport <width>` | 1440 | Default viewport width |
| `--user-agent <string>` | Chromium default | Custom user agent |

## Available Modules

| Module | What it extracts |
|--------|-----------------|
| `visual` | All computed colors (background, text, border, shadow, SVG fill/stroke) |
| `typography` | Font families, sizes, weights, line-heights, letter-spacing for all text nodes |
| `layout` | Flex/grid containers, gap values, breakpoint behavior, container widths, z-index |
| `components` | Component boundaries by semantic HTML, ARIA roles, and repeated structure |
| `assets` | Images, SVGs, font files downloaded locally |
| `animations` | CSS transitions, keyframe animations, JS-driven animation detection |
| `behavior` | Scroll effects, form validation states, dynamic content changes |
| `framework` | React/Vue/Angular/Svelte/Next.js/Nuxt detection; CSS framework detection |
| `network` | API endpoints called, request headers, response shapes (for behavior reconstruction) |

---

## Extraction Methodology (Reference)

### Color Extraction

Uses `getComputedStyle()` on every element in the DOM. Reads:
- `color`, `background-color`, `border-color`, `outline-color`
- `box-shadow` (parses color from shadow string)
- SVG `fill` and `stroke`
- CSS custom property definitions from `<style>` tags and linked stylesheets

Deduplication: colors within Euclidean distance < 5% in HSL space are considered identical (accounts for anti-aliasing and subpixel rendering variance).

```js
// DevTools console script — manual color extraction
const colors = new Set();
document.querySelectorAll('*').forEach(el => {
  const s = getComputedStyle(el);
  ['color','backgroundColor','borderColor','outlineColor'].forEach(p => {
    if (s[p] && s[p] !== 'rgba(0, 0, 0, 0)' && s[p] !== 'transparent') {
      colors.add(s[p]);
    }
  });
});
console.log(JSON.stringify([...colors]));
```

### Typography Extraction

Samples all text nodes (elements with `childElementCount === 0` and non-empty `textContent`). Groups by the tuple: `(fontFamily, fontSize, fontWeight, lineHeight, letterSpacing)`. Sorts by frequency descending.

```js
// DevTools console script — manual typography extraction
const types = {};
document.querySelectorAll('*').forEach(el => {
  if (!el.childElementCount && el.textContent.trim()) {
    const s = getComputedStyle(el);
    const key = `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.lineHeight}`;
    types[key] = (types[key] || 0) + 1;
  }
});
console.table(types);
```

### Spacing Extraction

Reads all computed `margin` and `padding` values on every element.

```js
// DevTools console script — manual spacing extraction
const spacings = new Set();
document.querySelectorAll('*').forEach(el => {
  const s = getComputedStyle(el);
  ['margin','padding'].forEach(p => {
    ['Top','Right','Bottom','Left'].forEach(side => {
      const v = s[p + side];
      if (v && v !== '0px') spacings.add(v);
    });
  });
});
console.log([...spacings].sort((a,b) => parseFloat(a)-parseFloat(b)).join('\n'));
```

### Layout Extraction

- Identifies flex containers: `display === 'flex'` → records `flexDirection`, `justifyContent`, `alignItems`, `gap`, `flexWrap`
- Identifies grid containers: `display === 'grid'` → records `gridTemplateColumns`, `gridTemplateRows`, `gap`
- Captures sticky/fixed elements (header, sidebar, nav) and their z-index
- Uses ResizeObserver to detect layout changes at 320, 375, 480, 768, 1024, 1280, 1440, 1920px widths

### Component Detection

Identifies component boundaries using:
1. Semantic HTML: `<nav>`, `<header>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<aside>`, `<dialog>`
2. ARIA roles: `role="button"`, `role="navigation"`, `role="dialog"`, etc.
3. Repeated structure patterns: computes a structural hash of `(tagName + classNames + childStructure)` and groups identical subtrees as component instances

### Asset Extraction

Downloads: `<img src>`, CSS `background-image: url()`, inline `<svg>` content (serialized), `@font-face src` URLs. Preserves original filenames where possible. Catalogues by MIME type.

### Animation Extraction

- Reads all `animation` and `transition` computed properties on interactive elements
- Parses keyframe rule text from `document.styleSheets`
- Uses `MutationObserver` + `requestAnimationFrame` hook to detect JS-driven animations on hover/click

### Framework Detection

```js
// React
window.__REACT_DEVTOOLS_GLOBAL_HOOK__?._renderers?.size > 0

// Next.js
!!window.__NEXT_DATA__

// Vue
!!window.__vue_devtools_global_hook__

// Angular
!!window.getAllAngularRootElements

// Svelte
document.querySelector('[class*="svelte-"]') !== null

// Tailwind CSS
[...document.styleSheets].some(s =>
  [...s.cssRules].some(r => /^\.(?:flex|grid|text-|bg-|p-|m-)/.test(r.selectorText))
)

// Bootstrap
document.querySelector('.container.row, .col-md-') !== null
```

---

## Troubleshooting

### CORS Issues

Some assets (fonts, images from CDNs) cannot be downloaded due to CORS. The extractor notes these in `extraction.json` under `corsBlocked`. Style data (colors, typography, layout) is always extractable regardless of CORS — it reads computed values, not network resources.

### Auth-Gated Pages

1. Open the page in Chrome, log in
2. Open DevTools → Application → Cookies → right-click domain → "Copy all"
3. Convert to Netscape format or JSON array:
   ```json
   [{"name": "session_token", "value": "abc123", "domain": ".example.com", "path": "/"}]
   ```
4. Save to `cookies.json` and pass: `--auth-cookies cookies.json`

### SPA Content Not Loaded

If the page renders content dynamically via JavaScript and the extraction captures an empty or partial page:
- Add `--wait-for-selector ".main-content"` (replace with an actual selector visible after load)
- Increase timeout: `--timeout 60000`
- Try `--wait-for-selector "[data-loaded='true']"` if the app sets a data attribute on load

### Playwright Not Installed

```bash
npx playwright install chromium
# For CI/CD with dependencies:
npx playwright install --with-deps chromium
```

### Partial Extraction

Each module runs independently. If one module fails (timeout, CORS, JS error), the others complete. Check `extraction.json` manifest — each module has a `status: "success" | "error"` field with an optional `error` message.

---

## Master Reconstruction Checklist

Follow this order for pixel-perfect rebuilds. Do not skip ahead.

1. [ ] **Design tokens** — colors (semantic roles), typography scale, spacing scale, shadows, border-radii, z-index
2. [ ] **Global styles** — CSS reset, body font/size/color defaults, focus-visible ring, `::selection` color
3. [ ] **Layout shell** — page grid, header (height, position, z-index), footer, sidebar, main content max-width
4. [ ] **Atomic: Buttons** — all variants (primary, secondary, ghost, danger, link); all states (hover, focus, active, disabled, loading)
5. [ ] **Atomic: Form elements** — Input, Textarea, Select, Checkbox, Radio, Toggle; with error and disabled states
6. [ ] **Atomic: Display** — Badge, Tag, Avatar, Icon, Spinner, Divider, Skeleton
7. [ ] **Typography** — Heading scale (h1–h6 with correct size/weight/line-height), paragraph, caption, label, code, blockquote
8. [ ] **Compound: Cards** — all card variants with correct padding, shadow, border-radius
9. [ ] **Compound: Navigation** — desktop nav (links, active state, hover), mobile nav (hamburger, drawer/sheet)
10. [ ] **Compound: Overlays** — Modal, Dropdown, Tooltip, Popover with correct positioning and backdrop
11. [ ] **Compound: Feedback** — Toast/Alert/Banner with all severity variants (success, warning, error, info)
12. [ ] **Page sections** — Hero, Feature grid, Pricing table, Testimonials, CTA section, Footer columns
13. [ ] **Responsive** — Test each component at 375, 768, 1024, 1440 — match breakpoint behavior from layout extraction
14. [ ] **Interactions** — Apply all hover/focus/active transitions from animation extraction (duration, easing)
15. [ ] **Behaviors** — Scroll effects (parallax, sticky reveal), form validation, dynamic state changes
16. [ ] **Verification** — Run `/designmaxxing verify` and resolve all CRITICAL and HIGH issues before declaring done
