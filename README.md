# designmaxxing

Pixel-perfect UI reverse engineering toolkit. Extract design tokens, components, and layout from any web app and turn them into actionable design system assets.

## Quick Start

```bash
npx designmaxxing extract https://stripe.com/payments
```

## Installation

```bash
# Global
npm install -g designmaxxing

# Per-project
npm install --save-dev designmaxxing

# Claude Code integration
npx designmaxxing install-claude
```

## CLI Reference

### `extract <url>`

Navigate to a URL with a headless browser and extract design data.

```bash
designmaxxing extract https://example.com [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--modules <list>` | `all` | Comma-separated modules: `visual,typography,layout,components,assets,animations,behavior,framework,network` |
| `--breakpoints <list>` | `375,768,1024,1280,1536` | Comma-separated viewport widths |
| `-o, --output <dir>` | `./designmaxxing-output` | Output directory |
| `--auth-cookies <file>` | — | Path to cookies JSON for authenticated pages |
| `--selector <css>` | — | Limit extraction to elements matching CSS selector |
| `--full-page` | `true` | Extract entire page (not just viewport) |
| `--no-headless` | — | Run browser in headed mode |
| `--timeout <ms>` | `30000` | Navigation timeout in milliseconds |
| `--wait-for-selector <css>` | — | Wait for this selector before extracting |

### `tokens <dir>`

Generate design tokens from extracted data.

```bash
designmaxxing tokens ./designmaxxing-output [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--format <type>` | `all` | `json`, `css`, `tailwind`, `scss`, or `all` |
| `-o, --output <dir>` | Same as `<dir>` | Output directory for token files |

### `report <dir>`

Generate a visual HTML (or Markdown) design system report.

```bash
designmaxxing report ./designmaxxing-output [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--format <type>` | `html` | `html` or `markdown` |
| `--open` | — | Open report in browser after generation |
| `--no-screenshots` | — | Skip embedding screenshots |

### `verify <original-url>`

Visual regression comparison between the original site and a rebuild.

```bash
designmaxxing verify https://original.com --rebuild https://my-rebuild.com [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--breakpoints <list>` | `375,768,1024,1280,1536` | Comma-separated viewport widths |
| `--threshold <ratio>` | `0.02` | Max acceptable pixel diff ratio (0–1) |
| `-o, --output <dir>` | `./designmaxxing-verify` | Output directory |

### `cleanup [dir]`

Remove extraction output directories.

### `install-claude`

Install the `/designmaxxing` skill and AI agents into Claude Code.

---

## Programmatic API

```typescript
import { extractAll } from 'designmaxxing'

const manifest = await extractAll({
  url: 'https://example.com',
  modules: ['visual', 'typography', 'layout'],
  breakpoints: [375, 768, 1280],
  output: './my-output',
  headless: true,
  fullPage: true,
  timeout: 30000,
  viewport: { width: 1280, height: 800 },
})

console.log(manifest.results) // { visual: 'visual.json', typography: 'typography.json', ... }
```

---

## Claude Code Integration

After running `designmaxxing install-claude`, the `/designmaxxing` skill is available in Claude Code.

```
/designmaxxing https://stripe.com/payments
```

This orchestrates four agents in sequence:

| Agent | Role |
|-------|------|
| **extractor** | Runs the CLI and captures all design data |
| **analyzer** | Reads the extraction output and identifies the design system |
| **reconstructor** | Generates components matching the original |
| **verifier** | Runs `designmaxxing verify` and reports diff results |

---

## Configuration

Create `.designmaxxingrc` in your project root:

```json
{
  "breakpoints": [375, 768, 1024, 1280, 1536],
  "modules": ["visual", "typography", "layout", "components", "assets", "animations", "behavior"],
  "output": "./designmaxxing-output",
  "headless": true,
  "fullPage": true,
  "timeout": 30000,
  "viewport": { "width": 1280, "height": 800 }
}
```

See `.designmaxxingrc.example` for the full annotated reference.

---

## Output Structure

```
designmaxxing-output/
├── manifest.json          # Links all results + metadata
├── visual.json            # Colors, shadows, borders, spacing
├── typography.json        # Type scale, font faces
├── layout.json            # Grid/flex configs, breakpoints
├── components.json        # Component inventory with states
├── assets.json            # Asset inventory (fonts, images, SVGs)
├── animations.json        # Transitions and keyframes
├── behavior.json          # Scroll behavior, forms, events
├── framework.json         # Tech stack detection
├── network.json           # API endpoints observed during load
├── tokens.json            # Generated design tokens
├── tokens.css             # CSS custom properties (:root {...})
├── tokens.tailwind.ts     # Tailwind theme extension
├── tokens.scss            # SCSS variables
├── report.html            # Visual HTML design system report
├── analysis.md            # Markdown summary
└── screenshots/
    ├── breakpoint-375.png
    ├── breakpoint-768.png
    └── breakpoint-1280.png
```

---

## Troubleshooting

**Playwright not installed**
```bash
npx playwright install chromium
```

**Auth-gated pages**

Export your session cookies from the browser (e.g. using a browser extension), save as `cookies.json`, then:
```bash
designmaxxing extract https://app.example.com --auth-cookies cookies.json
```

**SPA not rendering**
```bash
designmaxxing extract https://example.com --wait-for-selector ".main-content"
```

**CORS font blocking**

Expected — font URLs are still captured in `typography.json`, but the font files themselves won't download. This is normal.

**Slow extraction**

Limit to only the modules you need:
```bash
designmaxxing extract https://example.com --modules visual,typography
```

---

## Requirements

- Node.js ≥ 18
- Chromium (auto-installed by Playwright on first run)
