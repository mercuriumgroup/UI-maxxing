# Phase 4: CLI + Output Generators

**Model**: Sonnet
**Branch**: `feat/cli-generators`
**Estimated time**: 45 minutes
**Dependencies**: Phases 2 + 3 must be merged to main

## Objective

Build the full CLI interface (all commands) and the output generators that transform raw extraction data into design tokens, component inventories, layout blueprints, and HTML reports.

## Pre-flight

```bash
git checkout main && git pull
git checkout -b feat/cli-generators
npm install
```

## Step 1: CLI Entry Point — `src/cli/index.ts`

Replace the stub with a full Commander-based CLI:

```typescript
#!/usr/bin/env node
import { Command } from 'commander'
import { version } from '../../package.json' assert { type: 'json' }
// (or read version from package.json via fs)

const program = new Command()
  .name('designmaxxing')
  .description('Pixel-perfect UI reverse engineering toolkit')
  .version(version)

// Register sub-commands
program.addCommand(extractCommand)
program.addCommand(tokensCommand)
program.addCommand(verifyCommand)
program.addCommand(reportCommand)
program.addCommand(installClaudeCommand)

program.parse()
```

## Step 2: Extract Command — `src/cli/extract.ts`

```typescript
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { extractAll } from '../extractors/orchestrator.js'
import { ConfigSchema, ExtractionModules } from '../types/config.js'

export const extractCommand = new Command('extract')
  .description('Extract design data from a web page')
  .argument('<url>', 'URL to extract from')
  .option('--modules <list>', 'Comma-separated modules: visual,typography,layout,components,assets,animations,behavior,framework,network', 'all')
  .option('--breakpoints <list>', 'Comma-separated viewport widths', '375,768,1024,1280,1536')
  .option('-o, --output <dir>', 'Output directory', './designmaxxing-output')
  .option('--auth-cookies <file>', 'Path to cookies JSON for authenticated pages')
  .option('--selector <css>', 'Limit extraction to elements matching CSS selector')
  .option('--full-page', 'Extract entire page (not just viewport)', true)
  .option('--no-headless', 'Run browser in headed mode (visible)')
  .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
  .option('--wait-for-selector <css>', 'Wait for this selector before extracting')
  .action(async (url, options) => {
    // 1. Parse and validate options into ExtractionConfig using ConfigSchema
    // 2. Display banner: "designmaxxing — extracting from <url>"
    // 3. Show spinner with ora for each module
    // 4. Call extractAll(config)
    // 5. On success: print summary table with chalk
    //    - Colors found, typography entries, layout containers, etc.
    //    - Output file paths
    //    - Screenshots taken
    // 6. On error: print helpful error message with suggestions
    // 7. Print next steps: "Run `designmaxxing tokens ./designmaxxing-output` to generate design tokens"
  })
```

Key UX details:
- Use `ora` spinners for each extraction module (shows progress)
- Use `chalk` for colored output (green for success, red for errors, cyan for info)
- Print a summary table at the end showing what was extracted
- Handle Ctrl+C gracefully (close browser, clean up)
- If `--modules all`, run all modules; otherwise parse comma-separated list

## Step 3: Tokens Command — `src/cli/tokens.ts`

```typescript
export const tokensCommand = new Command('tokens')
  .description('Generate design tokens from extraction data')
  .argument('<dir>', 'Path to extraction output directory')
  .option('--format <type>', 'Output format: json, css, tailwind, scss, all', 'all')
  .option('-o, --output <dir>', 'Output directory for tokens (default: same as extraction dir)')
  .action(async (dir, options) => {
    // 1. Read extraction.json manifest
    // 2. Read visual.json, typography.json, layout.json
    // 3. Call generateDesignTokens() from generators
    // 4. Write output files based on format flag
    // 5. Print summary of generated files
  })
```

## Step 4: Verify Command — `src/cli/verify.ts`

```typescript
export const verifyCommand = new Command('verify')
  .description('Visual regression comparison between original and rebuild')
  .argument('<original-url>', 'Original website URL')
  .argument('<rebuild-url>', 'Your rebuild URL (e.g., http://localhost:3000)')
  .option('--breakpoints <list>', 'Comma-separated viewport widths', '375,768,1024,1280,1536')
  .option('--threshold <ratio>', 'Max acceptable pixel diff ratio (0-1)', '0.02')
  .option('-o, --output <dir>', 'Output directory for comparison', './designmaxxing-verify')
  .action(async (originalUrl, rebuildUrl, options) => {
    // 1. Launch Playwright
    // 2. For each breakpoint:
    //    a. Screenshot original URL
    //    b. Screenshot rebuild URL
    //    c. Compare using Playwright's expect(page).toHaveScreenshot() internally
    //       OR use pixelmatch library for programmatic comparison
    //    d. Generate diff image highlighting differences
    //    e. Calculate pixel diff percentage
    // 3. Write comparison results to output dir:
    //    - original-<breakpoint>.png
    //    - rebuild-<breakpoint>.png
    //    - diff-<breakpoint>.png
    //    - comparison.json (diff percentages per breakpoint)
    // 4. Print results table:
    //    Breakpoint | Diff % | Status
    //    375px      | 0.8%   | PASS
    //    768px      | 1.2%   | NEAR
    //    1024px     | 3.4%   | PARTIAL
    //    1280px     | 0.5%   | PASS
  })
```

Add `pixelmatch` and `pngjs` as dependencies for image comparison:
```bash
npm install pixelmatch pngjs
npm install -D @types/pngjs
```

## Step 5: Report Command — `src/cli/report.ts`

```typescript
export const reportCommand = new Command('report')
  .description('Generate a visual HTML report from extraction data')
  .argument('<dir>', 'Path to extraction output directory')
  .option('--format <type>', 'Report format: html, markdown', 'html')
  .option('--open', 'Open report in browser after generation')
  .action(async (dir, options) => {
    // 1. Read extraction.json manifest
    // 2. Read all module JSON files
    // 3. Read tokens if generated
    // 4. Call generateReport() from generators
    // 5. Write report.html to output dir
    // 6. If --open, use `open` (macOS) or `xdg-open` (Linux) to open in browser
  })
```

## Step 6: Install Claude Command

```typescript
export const installClaudeCommand = new Command('install-claude')
  .description('Install Claude Code skill and agents for /designmaxxing')
  .action(async () => {
    // Shell out to scripts/install-claude.sh
    // Or implement the same logic in Node.js for cross-platform support
  })
```

## Step 7: Design Token Generator — `src/generators/design-tokens.ts`

Replace the stub. This is the most important generator.

Input: `VisualExtractionResult`, `TypographyExtractionResult`, `LayoutExtractionResult`

Output: `DesignTokens` object + formatted file strings

### Token Generation Logic

**Colors**:
- Take all extracted colors from `visual.json`
- Cluster by deltaE < 3 → pick the most-used color in each cluster as canonical
- Sort by hue, then lightness
- Auto-name: `color-1` through `color-N` (user can rename via analyzer agent)
- Semantic naming heuristic:
  - Most-used background color → `bg-primary`
  - Most-used text color → `text-primary`
  - Colors used in < 3 elements → `accent-*`

**Typography**:
- Take type scale from `typography.json`
- Sort by fontSize descending
- Auto-name: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.
- Group font families: `font-heading`, `font-body`, `font-mono`

**Spacing**:
- Extract all unique margin/padding values from `visual.json`
- Parse to numbers, sort ascending
- Detect base unit (GCD of all values, or most common factor)
- Build scale: `space-1` through `space-N`

**Border Radius**:
- Deduplicate from `visual.json`
- Sort ascending
- Name: `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`

**Shadows**:
- Deduplicate from `visual.json`
- Sort by complexity (number of shadow layers, then blur radius)
- Name: `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`

**Breakpoints**:
- From `layout.json` breakpoint entries
- Name: `sm`, `md`, `lg`, `xl`, `2xl`

### Output Formats

**JSON** (`tokens.json`):
```json
{
  "colors": { "primary": "#1a1a2e", "secondary": "#16213e" },
  "typography": { "heading": { "fontFamily": "Inter", "fontSize": "2rem" } },
  "spacing": { "1": "0.25rem", "2": "0.5rem" },
  ...
}
```

**CSS** (`tokens.css`):
```css
:root {
  --color-primary: #1a1a2e;
  --color-secondary: #16213e;
  --font-heading: 'Inter', sans-serif;
  --space-1: 0.25rem;
  ...
}
```

**Tailwind** (`tailwind.config.ts`):
```typescript
export default {
  theme: {
    extend: {
      colors: { primary: '#1a1a2e', secondary: '#16213e' },
      fontFamily: { heading: ['Inter', 'sans-serif'] },
      spacing: { '1': '0.25rem' },
      ...
    }
  }
}
```

**SCSS** (`tokens.scss`):
```scss
$color-primary: #1a1a2e;
$font-heading: 'Inter', sans-serif;
$space-1: 0.25rem;
```

## Step 8: Component Inventory Generator — `src/generators/component-inventory.ts`

Input: `ComponentExtractionResult`, `DesignTokens`

Output: `components.json` with named, categorized components

- For each component entry, map raw CSS values to token references where possible
  - e.g., `color: rgb(26, 26, 46)` → `color: var(--color-primary)` if it matches
- Categorize: buttons, inputs, cards, navigation, layout, typography, media
- Include HTML snippet for each component
- Include all state variant styles

## Step 9: Layout Blueprint Generator — `src/generators/layout-blueprint.ts`

Input: `LayoutExtractionResult`

Output: `layout.json` documenting the page structure

- Tree of containers with their flex/grid config
- Responsive changes per breakpoint
- ASCII art representation of the grid (optional, nice for the report)

## Step 10: Report Generator — `src/generators/report.ts`

Input: All extraction data + tokens + screenshots

Output: `report.html` — a self-contained HTML file

The report should include (all inline, no external dependencies):
- **Header**: URL, timestamp, framework detection
- **Color palette**: swatches with hex values and token names
- **Typography scale**: preview of each text size with sample text
- **Spacing scale**: visual boxes showing each spacing value
- **Component gallery**: rendered HTML snippets of detected components
- **Layout diagram**: container hierarchy with dimensions
- **Screenshots**: side-by-side at each breakpoint
- **Animation list**: transitions with timing specs
- **Reconstruction checklist**: the master checklist with checkboxes

Use a `templates/report.html` template with `{{placeholders}}` that get replaced. Keep it simple — inline CSS, no JS framework. The report should work offline.

## Step 11: Verify & Commit

```bash
npm run build
# Test CLI:
node dist/cli/index.js --help
node dist/cli/index.js extract --help
node dist/cli/index.js tokens --help
node dist/cli/index.js verify --help
node dist/cli/index.js report --help
```

```bash
git add -A
git commit -m "feat: CLI commands + output generators — tokens, components, layout, HTML report"
git push -u origin feat/cli-generators
```

## Completion Criteria

- [ ] All 5 CLI commands work (`extract`, `tokens`, `verify`, `report`, `install-claude`)
- [ ] `--help` shows correct usage for every command
- [ ] Design token generator produces all 4 formats (JSON, CSS, Tailwind, SCSS)
- [ ] Component inventory maps raw values to token references
- [ ] Report generator produces a self-contained HTML file
- [ ] Verify command produces diff images and comparison JSON
- [ ] `npm run build` passes
- [ ] CLI banner and spinner UX works with chalk + ora
- [ ] Error handling for all edge cases (missing files, invalid URLs, etc.)
