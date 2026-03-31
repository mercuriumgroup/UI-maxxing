# Phase 5: Tests, Fixtures, Documentation & Polish

**Model**: Sonnet
**Branch**: `feat/tests-polish`
**Estimated time**: 30 minutes
**Dependencies**: All previous phases must be merged to main

## Objective

Add comprehensive tests, create test fixtures, write documentation, and polish the package for publication. After this phase, the package is ready for `npm publish`.

## Pre-flight

```bash
git checkout main && git pull
git checkout -b feat/tests-polish
npm install
```

## Step 1: Test Fixture HTML Page

Create `tests/fixtures/test-page.html` — a static HTML page with KNOWN, exact CSS values that tests can assert against:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Designmaxxing Test Fixture</title>
  <style>
    /* KNOWN VALUES - tests assert these exact values */

    :root {
      --color-primary: #1a1a2e;
      --color-secondary: #16213e;
      --color-accent: #e94560;
      --color-bg: #ffffff;
      --color-text: #333333;
      --color-border: #e0e0e0;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: var(--color-text);
      background-color: var(--color-bg);
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Layout: Flex header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: var(--color-primary);
      color: white;
    }

    /* Layout: CSS Grid main */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 32px;
      padding: 48px 0;
    }

    /* Typography scale */
    h1 { font-size: 48px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
    h2 { font-size: 32px; font-weight: 600; line-height: 1.2; }
    h3 { font-size: 24px; font-weight: 600; line-height: 1.3; }
    p { font-size: 16px; font-weight: 400; line-height: 1.5; }
    .caption { font-size: 12px; font-weight: 400; line-height: 1.4; color: #666666; }

    /* Component: Button */
    .btn {
      display: inline-flex;
      align-items: center;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.1s ease;
    }
    .btn-primary {
      background-color: var(--color-accent);
      color: white;
    }
    .btn-primary:hover {
      background-color: #d63851;
    }
    .btn-primary:active {
      transform: scale(0.98);
    }
    .btn-primary:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    /* Component: Card */
    .card {
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
      background-color: white;
    }
    .card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    /* Component: Input */
    .input {
      width: 100%;
      padding: 10px 16px;
      font-size: 14px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .input:focus {
      border-color: var(--color-accent);
    }

    /* Animation: Keyframes */
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-in { animation: fadeIn 0.3s ease-out forwards; }

    /* Responsive */
    @media (max-width: 768px) {
      .main-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      h1 { font-size: 32px; }
    }

    @media (max-width: 375px) {
      .container { padding: 0 16px; }
      .header { padding: 12px 16px; }
    }

    /* Sticky element */
    .sidebar {
      position: sticky;
      top: 24px;
    }

    /* Form with validation */
    .form-field { margin-bottom: 16px; }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo">Designmaxxing</div>
    <nav>
      <a href="#" style="color: white; margin-left: 24px;">Features</a>
      <a href="#" style="color: white; margin-left: 24px;">Pricing</a>
    </nav>
  </header>

  <div class="container">
    <div class="main-grid">
      <main>
        <h1 class="animate-in">Design Extraction</h1>
        <p>A paragraph with body text styling.</p>
        <p class="caption">A caption with smaller text.</p>

        <div style="margin-top: 32px; display: flex; gap: 16px;">
          <button class="btn btn-primary">Primary Button</button>
          <button class="btn btn-primary" disabled>Disabled Button</button>
        </div>

        <div class="card" style="margin-top: 32px;">
          <h3>Card Component</h3>
          <p>Card content with known padding and shadow.</p>
        </div>

        <form style="margin-top: 32px;">
          <div class="form-field">
            <label for="email">Email</label>
            <input class="input" id="email" type="email" required placeholder="you@example.com" pattern="[^@]+@[^@]+\.[^@]+" />
          </div>
          <div class="form-field">
            <label for="name">Name</label>
            <input class="input" id="name" type="text" required minlength="2" maxlength="100" />
          </div>
        </form>
      </main>

      <aside class="sidebar">
        <div class="card">
          <h3>Sidebar</h3>
          <p>Sticky sidebar content.</p>
        </div>
      </aside>
    </div>
  </div>

  <!-- SVG icon for asset extraction -->
  <svg style="display:none">
    <symbol id="icon-check" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </symbol>
  </svg>
</body>
</html>
```

## Step 2: Unit Tests — Utilities

Create `tests/utils/color.test.ts`:
- Test `rgbToHex`: `rgb(26, 26, 46)` → `#1a1a2e`
- Test `rgbToHsl`: known conversions
- Test `parseRgb`: various formats including `rgba()`
- Test `deltaE`: same color → 0, very different colors → high value
- Test `clusterColors`: group similar colors together

Create `tests/utils/css-parser.test.ts`:
- Test `parseBoxShadow`: single shadow, multi-shadow, inset shadows
- Test `parseMarginPadding`: shorthand (1-value, 2-value, 3-value, 4-value)
- Test `parseTransition`: single and multi-property transitions
- Test `extractNumericValue`: `"16px"` → 16, `"1.5rem"` → 1.5, `"auto"` → null

Create `tests/utils/dedup.test.ts`:
- Test `deduplicateValues`: counts duplicates correctly
- Test `detectScale`: detects 4px and 8px base units, handles non-uniform data
- Test `suggestTokenName`: generates sensible names from values

## Step 3: Integration Tests — Extractors

Create `tests/extractors/visual.test.ts`:

```typescript
import { test, expect, beforeAll, afterAll } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import path from 'path'

let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await chromium.launch()
  const context = await browser.newContext()
  page = await context.newPage()
  const fixturePath = path.resolve(__dirname, '../fixtures/test-page.html')
  await page.goto(`file://${fixturePath}`)
})

afterAll(async () => {
  await browser.close()
})

test('extracts correct colors from fixture', async () => {
  // Inject extract-colors.js, verify known colors are found:
  // #1a1a2e, #16213e, #e94560, #ffffff, #333333, #e0e0e0, #666666
})

test('extracts correct typography scale', async () => {
  // Inject extract-typography.js, verify:
  // h1: 48px/700, h2: 32px/600, h3: 24px/600, p: 16px/400, caption: 12px/400
})

test('detects flex and grid layouts', async () => {
  // Inject extract-layout.js, verify:
  // .header → display: flex, justify-content: space-between
  // .main-grid → display: grid, grid-template-columns: 1fr 300px
})

test('detects button component with states', async () => {
  // Inject extract-components.js
  // Verify .btn-primary is found
  // Verify hover state changes background-color
})

test('extracts animation keyframes', async () => {
  // Inject extract-animations.js
  // Verify fadeIn keyframes: 0% → opacity:0, translateY(8px); 100% → opacity:1, translateY(0)
  // Verify .btn transition: background-color 0.2s ease, transform 0.1s ease
})

test('detects breakpoints', async () => {
  // Inject extract-layout.js
  // Verify breakpoints: 768px, 375px detected from media queries
})

test('detects form validation', async () => {
  // Inject extract-behavior.js
  // Verify email input: required, pattern, type=email
  // Verify name input: required, minlength=2, maxlength=100
})

test('detects sticky positioning', async () => {
  // Inject extract-behavior.js
  // Verify .sidebar: position sticky, top 24px
})
```

Create similar test files for each extractor, all using the same fixture.

## Step 4: Integration Test — Token Generation

Create `tests/generators/design-tokens.test.ts`:

- Use known extraction data (hardcoded or from fixture extraction)
- Verify JSON output matches expected token structure
- Verify CSS output produces valid CSS custom properties
- Verify Tailwind config output is valid TypeScript
- Verify SCSS output produces valid SCSS variables
- Verify spacing scale detection: fixture uses 10, 12, 16, 24, 32, 48px → should detect 4px or 8px base

## Step 5: Integration Test — Full Pipeline

Create `tests/e2e/pipeline.test.ts`:

```typescript
import { test, expect } from 'vitest'
import { extractAll } from '../../src/extractors/orchestrator.js'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

test('full extraction pipeline produces expected output', async () => {
  const fixturePath = path.resolve(__dirname, '../fixtures/test-page.html')
  const outputDir = path.resolve(__dirname, '../output-test')

  const manifest = await extractAll({
    url: `file://${fixturePath}`,
    output: outputDir,
    modules: ['visual', 'typography', 'layout', 'components', 'animations', 'behavior'],
    breakpoints: [375, 768, 1280],
    headless: true,
    fullPage: true,
    timeout: 10000,
    viewport: { width: 1280, height: 800 },
  })

  // Verify manifest structure
  expect(manifest.url).toContain('test-page.html')
  expect(manifest.modules.length).toBeGreaterThan(0)

  // Verify output files exist
  expect(existsSync(path.join(outputDir, 'extraction.json'))).toBe(true)
  expect(existsSync(path.join(outputDir, 'visual.json'))).toBe(true)
  expect(existsSync(path.join(outputDir, 'typography.json'))).toBe(true)
  expect(existsSync(path.join(outputDir, 'layout.json'))).toBe(true)

  // Verify screenshots taken
  expect(existsSync(path.join(outputDir, 'screenshots', '375.png'))).toBe(true)
  expect(existsSync(path.join(outputDir, 'screenshots', '768.png'))).toBe(true)
  expect(existsSync(path.join(outputDir, 'screenshots', '1280.png'))).toBe(true)

  // Verify color extraction found known values
  const visual = JSON.parse(readFileSync(path.join(outputDir, 'visual.json'), 'utf-8'))
  const hexColors = visual.colors.map(c => c.hex)
  expect(hexColors).toContain('#1a1a2e')
  expect(hexColors).toContain('#e94560')
}, 60000) // 60s timeout for Playwright
```

## Step 6: README.md

Write a comprehensive README. Sections:

### Quick Start
```bash
npx designmaxxing extract https://stripe.com/payments
```

### Installation
```bash
# Global
npm install -g designmaxxing

# Per-project
npm install --save-dev designmaxxing

# Claude Code integration
npx designmaxxing install-claude
```

### CLI Reference
Document every command and flag (extract from phase-4 definitions).

### Programmatic API
```typescript
import { extractAll } from 'designmaxxing'

const manifest = await extractAll({
  url: 'https://example.com',
  modules: ['visual', 'typography', 'layout'],
  breakpoints: [375, 768, 1280],
})
```

### Claude Code Integration
- How to install the skill and agents
- Usage: `/designmaxxing <url>`
- The 4 agents and when they're used
- Workflow: extract → analyze → reconstruct → verify

### Configuration
Document `.designmaxxingrc` format with all options.

### Output Structure
```
designmaxxing-output/
├── extraction.json      # Manifest linking all results
├── visual.json          # Colors, shadows, borders, spacing
├── typography.json      # Type scale, font faces
├── layout.json          # Grid/flex configs, breakpoints
├── components.json      # Component inventory with states
├── assets.json          # Asset inventory
├── animations.json      # Transitions and keyframes
├── behavior.json        # Scroll, forms, events
├── framework.json       # Tech stack detection
├── network.json         # API endpoints
├── tokens.json          # Generated design tokens
├── tokens.css           # CSS custom properties
├── tailwind.config.ts   # Tailwind theme extension
├── analysis.md          # Human-readable analysis
├── report.html          # Visual HTML report
├── screenshots/
│   ├── 375.png
│   ├── 768.png
│   └── 1280.png
└── assets/
    ├── fonts/
    ├── images/
    └── svgs/
```

### Troubleshooting
- Playwright not installed → `npx playwright install chromium`
- Auth-gated pages → cookie injection guide
- CORS font blocking → expected, URLs still captured
- SPA not rendering → `--wait-for-selector` flag
- Slow extraction → limit modules with `--modules`

## Step 7: Example Config File

Create `.designmaxxingrc.example`:

```json
{
  "breakpoints": [375, 768, 1024, 1280, 1536],
  "modules": ["visual", "typography", "layout", "components", "assets", "animations", "behavior", "framework", "network"],
  "output": "./designmaxxing-output",
  "headless": true,
  "fullPage": true,
  "timeout": 30000,
  "viewport": { "width": 1280, "height": 800 }
}
```

## Step 8: Polish

- Ensure `package.json` `bin` field points to correct path
- Ensure `package.json` `files` includes all necessary dirs
- Add `LICENSE` file (MIT)
- Add `#!/usr/bin/env node` to CLI entry point
- Ensure `prepublishOnly` script works: `npm run build && npm run test`
- Run `npm pack --dry-run` to verify published contents

## Step 9: Verify & Commit

```bash
npm run build
npm run test
npm pack --dry-run  # verify package contents
```

```bash
git add -A
git commit -m "feat: tests, fixtures, README, config example — package ready for publish"
git push -u origin feat/tests-polish
```

## Completion Criteria

- [ ] Test fixture page has all known values documented in comments
- [ ] Unit tests cover all utility functions with edge cases
- [ ] Integration tests verify each extractor against the fixture
- [ ] Pipeline E2E test runs full extraction and verifies output
- [ ] All tests pass: `npm run test`
- [ ] README is comprehensive with all sections
- [ ] Example config file provided
- [ ] LICENSE file exists
- [ ] `npm pack --dry-run` shows correct package contents
- [ ] `npm run build && npm run test` passes (prepublishOnly)
- [ ] 80%+ test coverage on utilities and generators
