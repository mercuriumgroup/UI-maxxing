# Phase 1: Foundation — Project Scaffolding

**Model**: Opus
**Branch**: `feat/foundation`
**Estimated time**: 30 minutes
**Dependencies**: None (first phase)

## Objective

Create the complete project skeleton: package.json, TypeScript config, type system, config schema, and base utilities. Every other phase depends on this structure existing.

## Pre-flight

```bash
git checkout -b feat/foundation
```

## Step 1: Package Setup

Create `package.json`:

```json
{
  "name": "designmaxxing",
  "version": "0.1.0",
  "description": "Pixel-perfect UI reverse engineering toolkit — extract design tokens, components, and layout from any web app",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "designmaxxing": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test"
  },
  "keywords": ["reverse-engineering", "design-tokens", "ui", "css", "playwright", "extraction"],
  "license": "MIT",
  "engines": { "node": ">=18" },
  "files": ["dist", "claude", "scripts", "templates", "README.md"],
  "dependencies": {
    "playwright": "^1.48.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "zod": "^3.23.0",
    "fast-glob": "^3.3.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "vitest": "^2.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
})
```

Create `.gitignore`:

```
node_modules/
dist/
designmaxxing-output/
*.tsbuildinfo
.DS_Store
```

Create `.npmignore`:

```
src/
tests/
.claude/
thoughts/
vitest.config.ts
tsconfig.json
.gitignore
```

Run `npm install`.

## Step 2: Type System (`src/types/`)

Create `src/types/extraction.ts` — the core extraction result types:

```typescript
// Every extraction module returns a typed result.
// These types are the contract between extractors, generators, and the CLI.

export interface ExtractionManifest {
  readonly url: string
  readonly timestamp: string
  readonly breakpoints: readonly number[]
  readonly modules: readonly string[]
  readonly outputDir: string
  readonly framework: FrameworkDetection | null
  readonly results: Record<string, string> // module name → relative JSON path
}

export interface ElementSelector {
  readonly tag: string
  readonly classes: string
  readonly id: string
  readonly depth: number
  readonly path: string // CSS selector path to this element
}

export interface ComputedStyleEntry {
  readonly selector: ElementSelector
  readonly display: string
  readonly position: string
  readonly width: string
  readonly height: string
  readonly margin: string
  readonly padding: string
  readonly gap: string
  readonly fontSize: string
  readonly fontWeight: string
  readonly fontFamily: string
  readonly lineHeight: string
  readonly letterSpacing: string
  readonly color: string
  readonly backgroundColor: string
  readonly borderRadius: string
  readonly boxShadow: string
  readonly opacity: string
  readonly zIndex: string
  readonly overflow: string
  readonly textTransform: string
}

export interface ColorEntry {
  readonly hex: string
  readonly rgb: string
  readonly hsl: string
  readonly usageCount: number
  readonly properties: readonly string[] // which CSS properties use this color
  readonly sampleElements: readonly string[] // CSS selectors of elements using it
}

export interface TypographyEntry {
  readonly fontFamily: string
  readonly fontSize: string
  readonly fontWeight: string
  readonly lineHeight: string
  readonly letterSpacing: string
  readonly textTransform: string
  readonly sampleText: string
  readonly usageCount: number
}

export interface FontFaceEntry {
  readonly family: string
  readonly weight: string
  readonly style: string
  readonly src: string
  readonly format: string
  readonly display: string
  readonly unicodeRange: string
}

export interface LayoutEntry {
  readonly selector: string
  readonly display: string
  readonly flexDirection: string
  readonly flexWrap: string
  readonly justifyContent: string
  readonly alignItems: string
  readonly gap: string
  readonly gridTemplateColumns: string
  readonly gridTemplateRows: string
  readonly maxWidth: string
  readonly children: readonly LayoutEntry[]
}

export interface BreakpointEntry {
  readonly query: string
  readonly minWidth: number | null
  readonly maxWidth: number | null
  readonly source: string // stylesheet URL or inline
}

export interface ComponentEntry {
  readonly name: string
  readonly selector: string
  readonly html: string
  readonly states: Record<string, Record<string, string>> // state name → CSS property map
  readonly dimensions: { readonly width: string; readonly height: string }
  readonly children: readonly ComponentEntry[]
  readonly framework: string | null // React, Vue, etc.
}

export interface AssetEntry {
  readonly type: 'image' | 'svg' | 'font' | 'icon'
  readonly src: string
  readonly localPath: string | null // path after download
  readonly dimensions: { readonly width: number; readonly height: number } | null
  readonly format: string
  readonly metadata: Record<string, string>
}

export interface AnimationEntry {
  readonly selector: string
  readonly type: 'transition' | 'keyframes'
  readonly property: string
  readonly duration: string
  readonly timingFunction: string
  readonly delay: string
  readonly keyframes: readonly KeyframeEntry[] | null
}

export interface KeyframeEntry {
  readonly offset: string // e.g., "0%", "50%", "100%"
  readonly styles: Record<string, string>
}

export interface BehaviorEntry {
  readonly selector: string
  readonly events: readonly string[]
  readonly scrollBehavior: string | null
  readonly position: string | null // sticky, fixed
  readonly formValidation: FormValidationEntry | null
}

export interface FormValidationEntry {
  readonly type: string
  readonly required: boolean
  readonly pattern: string | null
  readonly minLength: number | null
  readonly maxLength: number | null
  readonly min: string | null
  readonly max: string | null
}

export interface FrameworkDetection {
  readonly frameworks: readonly FrameworkEntry[]
  readonly cssMethodology: readonly CSSMethodologyEntry[]
  readonly componentLibrary: readonly ComponentLibraryEntry[]
}

export interface FrameworkEntry {
  readonly name: string
  readonly version: string | null
  readonly confidence: number // 0-1
  readonly signals: readonly string[]
}

export interface CSSMethodologyEntry {
  readonly name: string // Tailwind, BEM, CSS Modules, CSS-in-JS
  readonly confidence: number
  readonly signals: readonly string[]
}

export interface ComponentLibraryEntry {
  readonly name: string // MUI, Chakra, Radix, shadcn, Ant Design
  readonly confidence: number
  readonly signals: readonly string[]
}

// Aggregated extraction results per module
export interface VisualExtractionResult {
  readonly styles: readonly ComputedStyleEntry[]
  readonly colors: readonly ColorEntry[]
  readonly shadows: readonly string[] // unique box-shadow values
  readonly borderRadii: readonly string[] // unique border-radius values
}

export interface TypographyExtractionResult {
  readonly scale: readonly TypographyEntry[]
  readonly fontFaces: readonly FontFaceEntry[]
  readonly fontLoadStrategy: string | null
}

export interface LayoutExtractionResult {
  readonly containers: readonly LayoutEntry[]
  readonly breakpoints: readonly BreakpointEntry[]
  readonly rootMaxWidth: string | null
}

export interface ComponentExtractionResult {
  readonly components: readonly ComponentEntry[]
  readonly totalElements: number
}

export interface AssetExtractionResult {
  readonly assets: readonly AssetEntry[]
  readonly downloadedCount: number
  readonly failedDownloads: readonly string[]
}

export interface AnimationExtractionResult {
  readonly transitions: readonly AnimationEntry[]
  readonly keyframes: readonly AnimationEntry[]
}

export interface BehaviorExtractionResult {
  readonly interactions: readonly BehaviorEntry[]
  readonly scrollBehaviors: readonly BehaviorEntry[]
  readonly forms: readonly BehaviorEntry[]
}

export interface NetworkExtractionResult {
  readonly endpoints: readonly NetworkEndpoint[]
  readonly harPath: string | null
}

export interface NetworkEndpoint {
  readonly method: string
  readonly url: string
  readonly status: number
  readonly contentType: string
  readonly payloadSize: number
}
```

Create `src/types/tokens.ts` — design token output types:

```typescript
export interface DesignTokens {
  readonly colors: Record<string, string>
  readonly typography: Record<string, TypographyToken>
  readonly spacing: Record<string, string>
  readonly borderRadius: Record<string, string>
  readonly shadows: Record<string, string>
  readonly breakpoints: Record<string, string>
  readonly transitions: Record<string, string>
  readonly zIndex: Record<string, number>
}

export interface TypographyToken {
  readonly fontFamily: string
  readonly fontSize: string
  readonly fontWeight: string
  readonly lineHeight: string
  readonly letterSpacing: string
}

export type TokenOutputFormat = 'json' | 'css' | 'tailwind' | 'scss'
```

Create `src/types/config.ts` — configuration types:

```typescript
import { z } from 'zod'

export const ExtractionModules = [
  'visual',
  'typography',
  'layout',
  'components',
  'assets',
  'animations',
  'behavior',
  'framework',
  'network',
] as const

export type ExtractionModule = typeof ExtractionModules[number]

export const ConfigSchema = z.object({
  url: z.string().url(),
  modules: z.array(z.enum(ExtractionModules)).default([...ExtractionModules]),
  breakpoints: z.array(z.number().int().positive()).default([375, 768, 1024, 1280, 1536]),
  output: z.string().default('./designmaxxing-output'),
  selector: z.string().optional(),
  fullPage: z.boolean().default(true),
  headless: z.boolean().default(true),
  timeout: z.number().int().positive().default(30000),
  authCookies: z.string().optional(), // path to cookies JSON
  waitForSelector: z.string().optional(),
  userAgent: z.string().optional(),
  viewport: z.object({
    width: z.number().default(1280),
    height: z.number().default(800),
  }).default({}),
})

export type ExtractionConfig = z.infer<typeof ConfigSchema>

export const VerifyConfigSchema = z.object({
  originalUrl: z.string().url(),
  rebuildUrl: z.string().url(),
  breakpoints: z.array(z.number().int().positive()).default([375, 768, 1024, 1280, 1536]),
  threshold: z.number().min(0).max(1).default(0.02),
  output: z.string().default('./designmaxxing-verify'),
})

export type VerifyConfig = z.infer<typeof VerifyConfigSchema>
```

Create `src/types/report.ts`:

```typescript
export interface ReportData {
  readonly manifest: import('./extraction.js').ExtractionManifest
  readonly tokens: import('./tokens.js').DesignTokens | null
  readonly screenshotPaths: Record<number, string> // breakpoint → path
  readonly frameworkReport: import('./extraction.js').FrameworkDetection | null
  readonly componentCount: number
  readonly assetCount: number
  readonly endpointCount: number
}

export type ReportFormat = 'html' | 'markdown'
```

Create `src/types/index.ts` — barrel export:

```typescript
export * from './extraction.js'
export * from './tokens.js'
export * from './config.js'
export * from './report.js'
```

## Step 3: Utility Functions (`src/utils/`)

Create `src/utils/color.ts`:

Color parsing and conversion utilities — parse `rgb(r, g, b)` / `rgba(r, g, b, a)` to hex and hsl. Include a `deltaE` function for clustering similar colors. All functions must be pure (no mutation).

Key functions:
- `rgbToHex(rgb: string): string`
- `rgbToHsl(rgb: string): string`
- `parseRgb(rgb: string): { r: number, g: number, b: number, a: number }`
- `hexToRgb(hex: string): { r: number, g: number, b: number }`
- `deltaE(color1: string, color2: string): number` — perceptual color distance
- `clusterColors(colors: string[], threshold: number): string[][]` — group similar colors

Create `src/utils/css-parser.ts`:

CSS value parsing utilities:
- `parseBoxShadow(value: string): Array<{ color, offsetX, offsetY, blur, spread }>`
- `parseMarginPadding(value: string): { top, right, bottom, left }`
- `parseFontShorthand(value: string): { family, size, weight, lineHeight }`
- `parseTransition(value: string): Array<{ property, duration, timingFunction, delay }>`
- `extractNumericValue(value: string): number | null` — e.g., "16px" → 16

Create `src/utils/dedup.ts`:

Deduplication and scale detection:
- `deduplicateValues(values: string[]): Array<{ value: string, count: number }>`
- `detectScale(values: number[]): { base: number, multipliers: number[] } | null` — detect if values follow a consistent scale (e.g., 4px base: 4, 8, 12, 16, 24, 32)
- `suggestTokenName(value: string, scale: string[]): string` — e.g., "16px" in a spacing scale → "space-4"

Create `src/utils/fs.ts`:

File system helpers:
- `ensureDir(dir: string): Promise<void>`
- `writeJson(path: string, data: unknown): Promise<void>` — pretty-printed JSON
- `readJson<T>(path: string): Promise<T>`
- `resolveOutputPath(config: ExtractionConfig, filename: string): string`

## Step 4: Base Extractor Class

Create `src/extractors/base.ts`:

This is the foundation class all extractors extend:

```typescript
import { chromium, type Browser, type Page, type BrowserContext } from 'playwright'
import type { ExtractionConfig } from '../types/config.js'

export abstract class BaseExtractor<TResult> {
  protected page!: Page
  protected config: ExtractionConfig

  constructor(config: ExtractionConfig) {
    this.config = config
  }

  // Subclasses implement this
  abstract extract(): Promise<TResult>

  // Shared: inject a JS script file into the page and get results
  protected async injectScript<T>(scriptContent: string, args?: unknown): Promise<T> {
    return this.page.evaluate(
      new Function('args', scriptContent + '\nreturn __extract(args)') as any,
      args
    )
  }

  // Set page from orchestrator (shared browser instance)
  setPage(page: Page): void {
    this.page = page
  }

  // Capture screenshot at current viewport
  protected async screenshot(name: string): Promise<string> {
    // saves to output dir, returns path
  }

  // Resize viewport and wait for layout
  protected async setBreakpoint(width: number): Promise<void> {
    await this.page.setViewportSize({ width, height: this.config.viewport.height })
    await this.page.waitForTimeout(500) // allow layout reflow
  }
}
```

Also create `src/extractors/orchestrator.ts`:

The orchestrator manages a single browser instance shared across all extractors. It:
- Launches Playwright browser
- Navigates to URL
- Starts HAR recording if network module enabled
- Runs each enabled extractor
- Saves results to output dir
- Generates the ExtractionManifest

## Step 5: Programmatic API Entry Point

Create `src/index.ts`:

```typescript
export { extractAll } from './extractors/orchestrator.js'
export type * from './types/index.js'
export { ConfigSchema } from './types/config.js'
```

This is the public API for programmatic usage:
```typescript
import { extractAll } from 'designmaxxing'
const results = await extractAll({ url: 'https://example.com' })
```

## Step 6: Stub Files for Later Phases

Create stub/placeholder files so the project compiles and later phases can fill them in:

- `src/cli/index.ts` — just a `#!/usr/bin/env node` + `console.log('designmaxxing CLI — coming soon')` placeholder
- `src/extractors/visual.ts` — export class extending BaseExtractor with TODO extract()
- `src/extractors/typography.ts` — same stub
- `src/extractors/layout.ts` — same stub
- `src/extractors/components.ts` — same stub
- `src/extractors/assets.ts` — same stub
- `src/extractors/animations.ts` — same stub
- `src/extractors/behavior.ts` — same stub
- `src/extractors/framework.ts` — same stub
- `src/extractors/network.ts` — same stub
- `src/generators/design-tokens.ts` — stub
- `src/generators/component-inventory.ts` — stub
- `src/generators/layout-blueprint.ts` — stub
- `src/generators/report.ts` — stub
- `src/scripts/` — create empty `.js` files for each injectable script

Each stub should export the expected class/function with a `throw new Error('Not implemented')` body so TypeScript compiles but runtime failures are obvious.

## Step 7: Verify Build

```bash
npm run build
npm run lint
```

Both must pass with zero errors.

## Step 8: Initial Commit

```bash
git add -A
git commit -m "feat: project foundation — types, config, base extractor, utilities"
git push -u origin feat/foundation
```

Then merge to main so other phases can branch from it.

## Completion Criteria

- [ ] `npm install` succeeds
- [ ] `npm run build` produces `dist/` with zero errors
- [ ] All type files export correct interfaces
- [ ] Config schema validates correctly with zod
- [ ] Base extractor class compiles
- [ ] Orchestrator stub compiles
- [ ] All extractor/generator stubs compile
- [ ] Utility functions have correct signatures
- [ ] Project structure matches the architecture in `.claude/plan.md`
