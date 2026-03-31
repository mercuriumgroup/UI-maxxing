# Implementation Plan: designmaxxing — UI Reverse Engineering Toolkit

## Requirements Restatement

Build an installable npm package + Claude Code skill system that enables pixel-perfect reverse engineering of any web UI. The toolkit:

1. **npm package** (`designmaxxing`) — TypeScript CLI + programmatic API powered by Playwright
2. **Claude Code skill** (`/designmaxxing`) — master orchestration command
3. **4 specialized sub-agents** — extractor, analyzer, reconstructor, verifier
4. **Install script** — copies skill + agents into any project's Claude Code setup

A developer runs `/designmaxxing https://stripe.com/payments` and gets back a complete extraction: design tokens, component inventory, layout blueprints, asset bundles, animation specs, framework detection, and a reconstruction checklist — all structured and machine-readable.

---

## Architecture Overview

```
designmaxxing/
├── src/                          # TypeScript source (npm package)
│   ├── cli/                      # CLI entry point + commands
│   │   ├── index.ts              # Main CLI (commander)
│   │   ├── extract.ts            # `designmaxxing extract <url>`
│   │   ├── tokens.ts             # `designmaxxing tokens <dir>`
│   │   ├── verify.ts             # `designmaxxing verify <orig> <rebuild>`
│   │   └── report.ts             # `designmaxxing report <dir>`
│   ├── extractors/               # Playwright extraction modules
│   │   ├── base.ts               # Base extractor class + shared utilities
│   │   ├── visual.ts             # Colors, shadows, borders, spacing, sizing
│   │   ├── typography.ts         # Font families, sizes, weights, line-heights
│   │   ├── layout.ts             # Grid/flex detection, containers, breakpoints
│   │   ├── components.ts         # Component boundaries, states, variants
│   │   ├── assets.ts             # Fonts, icons, images, SVGs
│   │   ├── animations.ts         # Transitions, keyframes, timing functions
│   │   ├── behavior.ts           # Event listeners, scroll, forms
│   │   ├── framework.ts          # React/Vue/Angular/Svelte + CSS methodology
│   │   └── network.ts            # API patterns, HAR capture, payloads
│   ├── generators/               # Output generators
│   │   ├── design-tokens.ts      # JSON / CSS vars / Tailwind config output
│   │   ├── component-inventory.ts # Structured component catalog
│   │   ├── layout-blueprint.ts   # Grid/flex documentation
│   │   └── report.ts             # Human-readable HTML/MD report
│   ├── scripts/                  # Browser-injectable JS extraction scripts
│   │   ├── extract-styles.js     # Computed style bulk extraction
│   │   ├── extract-colors.js     # Color palette extraction
│   │   ├── extract-typography.js # Typography system extraction
│   │   ├── extract-layout.js     # Flex/grid detection
│   │   ├── extract-components.js # Component boundary detection
│   │   ├── extract-assets.js     # Font/icon/image inventory
│   │   ├── extract-animations.js # Animation/transition capture
│   │   ├── extract-behavior.js   # Event listener mapping
│   │   └── detect-framework.js   # Tech stack fingerprinting
│   ├── types/                    # TypeScript type definitions
│   │   ├── extraction.ts         # Extraction result types
│   │   ├── tokens.ts             # Design token types
│   │   ├── config.ts             # Configuration types
│   │   └── report.ts             # Report types
│   ├── utils/                    # Shared utilities
│   │   ├── color.ts              # Color parsing/conversion (rgb→hex→hsl)
│   │   ├── css-parser.ts         # CSS value parsing
│   │   ├── dedup.ts              # Value deduplication + scale detection
│   │   └── fs.ts                 # File system helpers
│   └── index.ts                  # Programmatic API entry point
├── claude/                       # Claude Code integration (copied on install)
│   ├── skill/
│   │   └── SKILL.md              # Master /designmaxxing skill
│   └── agents/
│       ├── designmaxxing-extractor.md
│       ├── designmaxxing-analyzer.md
│       ├── designmaxxing-reconstructor.md
│       └── designmaxxing-verifier.md
├── templates/                    # Output templates
│   ├── report.html               # HTML report template
│   └── tailwind.config.template.ts
├── scripts/
│   └── install-claude.sh         # Copies skill + agents to ~/.claude/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── .designmaxxingrc.example      # Example config
```

---

## Phase 1: Project Scaffolding

### 1.1 Initialize npm package
- `package.json` with `bin: { "designmaxxing": "./dist/cli/index.js" }`
- TypeScript config (strict, ESM output)
- Dependencies: `playwright`, `commander`, `chalk`, `ora`, `zod`, `fast-glob`
- Dev dependencies: `vitest`, `typescript`, `@types/node`

### 1.2 Type system
- Define all extraction result interfaces in `src/types/`
- `ExtractionConfig` — URL, selectors, breakpoints, output dir, enabled modules
- `ExtractionResult` — union of all module results
- `DesignTokens` — colors, typography, spacing, shadows, radii, breakpoints
- `ComponentEntry` — tag, classes, states, dimensions, styles per state
- `LayoutBlueprint` — containers, grids, flex configs per breakpoint

### 1.3 Config file support
- `.designmaxxingrc` / `designmaxxing.config.ts` parsed with zod
- Sensible defaults (all modules enabled, standard breakpoints, `./designmaxxing-output/` dir)

---

## Phase 2: Browser-Injectable Extraction Scripts (`src/scripts/`)

These are pure JavaScript files injected into the target page via `page.evaluate()`. They run in the browser context and return structured JSON. This is where the core reverse engineering research from the conversation gets codified.

### 2.1 `extract-styles.js` — Bulk computed style extraction
- Walk a DOM subtree, capture computed styles for every element
- Return: tag, classes, depth, display, position, dimensions, margin, padding, gap, font properties, colors, borders, shadows, opacity, z-index
- Configurable: max depth, selector filter, property whitelist

### 2.2 `extract-colors.js` — Color palette extraction
- Scan every element for color, backgroundColor, borderColor, outlineColor, boxShadow colors
- Deduplicate, convert all to hex + hsl
- Cluster similar colors (within deltaE threshold) to detect the intended palette
- Return: sorted unique colors with usage count and sample elements

### 2.3 `extract-typography.js` — Typography system
- Scan all text-containing elements
- Extract: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform
- Deduplicate into a type scale
- Detect font-face declarations from stylesheets
- Return: type scale entries, font-face rules, font loading strategy

### 2.4 `extract-layout.js` — Layout detection
- Find all flex/grid containers
- Extract: display, direction, wrap, justify, align, gap, template-columns/rows
- Find max-width containers and centering patterns
- Extract media queries from stylesheets for breakpoints
- Return: layout tree, breakpoints, container hierarchy

### 2.5 `extract-components.js` — Component archaeology
- Detect component boundaries via framework markers (React fiber, Vue `data-v-`, Svelte hashed classes)
- Fall back to heuristic boundary detection (repeated DOM patterns)
- For each component: capture all CSS for default + all pseudo-states
- Return: component tree with state variants

### 2.6 `extract-assets.js` — Asset inventory
- All `<img>` elements with src, srcset, sizes, natural dimensions
- All inline SVGs with viewBox and path data
- All `<svg><use>` sprite references
- Background images from computed styles
- Font files from network (captured separately by Playwright)
- Return: categorized asset inventory with download URLs

### 2.7 `extract-animations.js` — Animation/transition capture
- Scan all elements for non-default `transition` values
- Extract `@keyframes` from stylesheets
- Capture: property, duration, timing-function, delay per element
- Return: transition registry + keyframe definitions

### 2.8 `extract-behavior.js` — Interaction mapping
- Use `getEventListeners()` (Chrome DevTools protocol) for event inventory
- Detect scroll behaviors: sticky, fixed, snap, smooth
- Detect intersection observers via MutationObserver on class changes
- Map form validation attributes
- Return: event map, scroll behaviors, form specs

### 2.9 `detect-framework.js` — Tech stack fingerprinting
- Check for Next.js, Nuxt, React, Vue, Angular, Svelte, Remix, Gatsby, Astro markers
- Detect CSS methodology: Tailwind (utility class frequency analysis), BEM, CSS Modules, CSS-in-JS
- Detect component libraries: MUI, Chakra, Ant Design, Radix, shadcn/ui
- Return: detected frameworks, CSS methodology, component library, confidence scores

---

## Phase 3: Playwright Extraction Engine (`src/extractors/`)

Each extractor module wraps the injectable scripts with Playwright orchestration.

### 3.1 `base.ts` — Base extractor
- Launch browser with `chromium.launch()`
- Navigate to URL, wait for network idle
- Handle authentication (cookie injection from config)
- Provide `injectAndRun(scriptPath, args)` helper
- Screenshot at configurable breakpoints
- Download assets to output directory
- HAR recording start/stop

### 3.2 One extractor per module
Each extends base and:
1. Injects the corresponding script from `src/scripts/`
2. Captures multi-breakpoint data (resize viewport, re-extract)
3. For interaction states: programmatically hover/focus/click elements and re-extract
4. Writes results to `<output>/<module>.json`
5. Downloads relevant assets (fonts, images, SVGs) to `<output>/assets/`

### 3.3 Orchestrator
- `extractAll(config)` — runs all enabled extractors in sequence
- Shares a single browser instance across extractors
- Generates a manifest (`extraction.json`) linking all results
- Takes full-page screenshots at each breakpoint as reference images

---

## Phase 4: Output Generators (`src/generators/`)

### 4.1 `design-tokens.ts`
- Input: color, typography, spacing, shadow, radius extraction data
- Detect scales and naming patterns (e.g., spacing follows 4px grid → `space-1` through `space-16`)
- Output formats:
  - `tokens.json` — raw structured tokens
  - `tokens.css` — CSS custom properties
  - `tailwind.config.ts` — Tailwind theme extension
  - `tokens.scss` — SCSS variables (optional)

### 4.2 `component-inventory.ts`
- Input: component extraction data
- Output: `components.json` — each component with:
  - Name (inferred from classes/data attributes)
  - HTML structure
  - Styles per state (default, hover, focus, active, disabled)
  - Dimensions, spacing, typography per breakpoint
  - Animation specs

### 4.3 `layout-blueprint.ts`
- Input: layout extraction data
- Output: `layout.json` — container hierarchy, grid/flex configs per breakpoint
- Optional: ASCII art layout diagram in the report

### 4.4 `report.ts`
- Input: all extraction data
- Output: `report.html` — visual, browsable report with:
  - Color swatches
  - Type scale preview
  - Layout diagrams
  - Component gallery with state toggles
  - Screenshot overlays at each breakpoint
  - Framework detection summary
  - Reconstruction checklist

---

## Phase 5: CLI (`src/cli/`)

### 5.1 Commands

```
designmaxxing extract <url> [options]
  --modules <list>     # Comma-separated: visual,typography,layout,components,assets,animations,behavior,framework,network (default: all)
  --breakpoints <list> # Comma-separated viewport widths (default: 375,768,1024,1280,1536)
  --output <dir>       # Output directory (default: ./designmaxxing-output)
  --auth-cookies <file> # JSON file with cookies for authenticated pages
  --selector <css>     # Limit extraction to elements matching selector
  --full-page          # Extract entire page (default: viewport only)
  --headless           # Run headless (default: true)
  --timeout <ms>       # Navigation timeout (default: 30000)

designmaxxing tokens <extraction-dir>
  --format <type>      # json, css, tailwind, scss (default: all)
  --output <dir>       # Output directory

designmaxxing verify <original-url> <rebuild-url>
  --threshold <ratio>  # Max diff pixel ratio (default: 0.02)
  --breakpoints <list> # Viewports to compare

designmaxxing report <extraction-dir>
  --format <type>      # html, markdown (default: html)
  --open               # Open in browser after generation

designmaxxing install-claude
  # Copies skill + agents to ~/.claude/
```

---

## Phase 6: Claude Code Integration

### 6.1 Master Skill: `/designmaxxing`

File: `claude/skill/SKILL.md`

The skill is the entry point invoked by `/designmaxxing <url>`. It:
1. Validates the URL
2. Spawns the **extractor agent** to run the CLI extraction
3. Spawns the **analyzer agent** to interpret results and generate tokens
4. Presents findings to the user
5. Offers to spawn the **reconstructor agent** for guided rebuild
6. Offers to spawn the **verifier agent** for visual regression

### 6.2 Agent: `designmaxxing-extractor`

Tools: `Read, Write, Bash, Glob, Grep`
Model: `sonnet`

Responsibilities:
- Run `npx designmaxxing extract <url>` with appropriate flags
- Monitor output, handle errors (timeouts, auth failures, CORS)
- Read extraction JSON results
- Summarize what was captured
- Flag any extraction gaps (e.g., "couldn't extract fonts — CORS blocked")

### 6.3 Agent: `designmaxxing-analyzer`

Tools: `Read, Write, Edit, Bash, Glob, Grep`
Model: `opus`

Responsibilities:
- Read all extraction JSON files
- Identify design system patterns: spacing scale, color palette semantic names, type hierarchy
- Generate design tokens in requested format
- Produce the component inventory with suggested naming
- Detect inconsistencies ("this component uses 13px font — likely a rounding error, intended 14px")
- Write analysis to `analysis.md` in output directory

### 6.4 Agent: `designmaxxing-reconstructor`

Tools: `Read, Write, Edit, Bash, Glob, Grep`
Model: `opus`

Responsibilities:
- Read extraction data + analysis
- Guide user through rebuilding: tokens → layout → components → interactions
- Generate starter code: CSS variables file, Tailwind config, base layout components
- Reference extracted screenshots as ground truth
- Build bottom-up: atoms → molecules → organisms → pages
- Provide exact CSS for each component based on extracted computed styles

### 6.5 Agent: `designmaxxing-verifier`

Tools: `Read, Write, Bash, Glob, Grep`
Model: `sonnet`

Responsibilities:
- Run `npx designmaxxing verify <original> <rebuild>`
- Read Playwright visual comparison results
- Report pixel diff percentages per breakpoint
- Identify specific regions that don't match
- Suggest fixes based on the diff

### 6.6 Install Script

`scripts/install-claude.sh`:
- Copies `claude/skill/` → `~/.claude/skills/designmaxxing/`
- Copies `claude/agents/*.md` → `~/.claude/agents/`
- Also triggered by `designmaxxing install-claude` CLI command
- Also offered as `postinstall` npm hook (with user confirmation)

---

## Phase 7: Testing

### 7.1 Unit tests (vitest)
- Color parsing/conversion utilities
- CSS value parsing
- Deduplication and scale detection
- Token generation output format
- Config validation

### 7.2 Integration tests
- Each extractor against a local test HTML fixture (served by Playwright)
- End-to-end CLI test: extract a fixture → verify output structure
- Token generation from fixture extraction data

### 7.3 Test fixtures
- `tests/fixtures/test-page.html` — static page with known CSS values
- Tests assert extracted values match the known values exactly
- Covers: colors, typography, layout, components, animations, responsive

---

## Phase 8: Documentation and Packaging

### 8.1 README.md
- Quick start (npx usage)
- CLI reference
- Programmatic API
- Claude Code integration guide
- Configuration reference
- Examples

### 8.2 npm publishing
- `prepublishOnly` script: build + test
- `.npmignore` excluding tests, fixtures, source
- `types` field pointing to generated `.d.ts`

---

## Implementation Order

| Step | Phase | Est. Files | Priority |
|------|-------|-----------|----------|
| 1 | 1.1–1.3: Scaffold, types, config | ~12 | Foundation |
| 2 | 2.1–2.9: Injectable scripts | 9 | Core value |
| 3 | 3.1–3.3: Playwright extractors | 11 | Core value |
| 4 | 5.1: CLI extract command | 2 | Usable MVP |
| 5 | 4.1: Design token generator | 1 | Key output |
| 6 | 4.4: Report generator | 1 | Key output |
| 7 | 6.1–6.6: Claude skill + agents + install | 6 | Integration |
| 8 | 5.1: Remaining CLI commands (tokens, verify, report) | 3 | Polish |
| 9 | 7.1–7.3: Tests | ~8 | Quality |
| 10 | 8.1–8.2: Docs + packaging | 2 | Ship |

**Total estimated files: ~55**

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| CORS blocking font/asset downloads | HIGH | Use Playwright's route interception to capture all network responses; fall back to listing URLs |
| SPA content not rendered at extraction time | HIGH | Wait for network idle + configurable wait time + optional selector wait |
| Auth-gated pages | MEDIUM | Cookie injection from config file; document auth patterns |
| Cross-origin stylesheet access | MEDIUM | Use Playwright CDP to access all stylesheets regardless of origin |
| Massive extraction output for complex pages | MEDIUM | Configurable selector scope, max depth, property whitelist |
| Framework detection false positives | LOW | Confidence scoring; multiple signals required |

---

## Confirmation Required

Proceed with this plan? The implementation order is designed so that after Step 4 you have a working MVP (`npx designmaxxing extract <url>` producing JSON output). Each subsequent step adds a layer of value.
