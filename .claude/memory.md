# Designmaxxing Session Memory

## Project Overview

**designmaxxing** — A pixel-perfect UI reverse engineering toolkit. Enables extracting design tokens, components, layout, and assets from any web app. Installable npm package + Claude Code skill system.

## Architecture (Complete)

**5-phase implementation plan** committed to repo:

1. **Phase 1: Foundation** — TypeScript project scaffold, types, config schema, base extractor, utilities
2. **Phase 2: Extraction Engine** — 9 browser-injectable JS scripts + 9 Playwright extractors + orchestrator
3. **Phase 3: Claude Integration** — /designmaxxing skill + 4 sub-agents (extractor, analyzer, reconstructor, verifier) + install script
4. **Phase 4: CLI + Generators** — 5 CLI commands (extract, tokens, verify, report, install-claude) + output generators (design tokens, component inventory, layout blueprint, HTML report)
5. **Phase 5: Tests + Polish** — Test fixtures, unit/integration/E2E tests, README, example config, ready for npm publish

**Total estimated effort**: ~3.5 hours sequential, ~2.5 hours parallel (phases 2+3 run simultaneously after phase 1)

## Execution Status

**Current state**: All 5 phase plans written and committed to main branch.

**Files created**:
- `.claude/plan.md` — Master architecture overview (read by all phases)
- `.claude/plans/EXECUTION-ORDER.md` — Parallel window execution guide
- `.claude/plans/phase-1-foundation.md` — Opus model, 30 min, no dependencies
- `.claude/plans/phase-2-extractors.md` — Opus model, 60 min, depends on phase 1
- `.claude/plans/phase-3-claude-integration.md` — Sonnet model, 30 min, depends on phase 1, parallel with phase 2
- `.claude/plans/phase-4-cli-generators.md` — Sonnet model, 45 min, depends on phases 2+3
- `.claude/plans/phase-5-tests-polish.md` — Sonnet model, 30 min, depends on phase 4

**Ready to execute**: Yes. Can start Phase 1 immediately.

## Key Design Decisions

### 1. Extraction Scripts as Injected JS (not Puppeteer plugins)
- Each module (visual, typography, layout, etc.) has a pure JavaScript file (`src/scripts/extract-*.js`)
- Scripts are injected into target page via `page.evaluate()` — no Node.js dependencies
- Each script exports a `__extract(args)` function returning structured JSON
- Advantage: works with any Playwright page, easy to test, can be audited as plain JS

### 2. Shared Browser Instance + Modular Extractors
- Orchestrator launches one Playwright browser, one context, one page
- Each extractor gets the shared page, runs its script(s), outputs JSON to `<output>/<module>.json`
- Breakpoint iteration: orchestrator handles resizing/re-extraction across all extractors
- Advantage: fast (no browser launch per module), coordinated, stateful (can preserve auth across modules)

### 3. Multi-Format Token Output
- Design token generator produces 4 formats: JSON (canonical), CSS custom properties, Tailwind config, SCSS variables
- Format selection at CLI level: `designmaxxing tokens <dir> --format all` generates all
- Advantage: users can use whichever format their project needs; CSS vars as fallback for CSS-only projects

### 4. Claude Skill as Orchestration Layer
- Master `/designmaxxing` skill calls specialized sub-agents in sequence
- Extractor agent → Analyzer agent → optional Reconstructor/Verifier agents
- Skill handles error recovery (one agent failure doesn't block the workflow)
- Advantage: human-friendly guidance, visual summaries, next-step suggestions

### 5. Test Fixture with Known Values
- Single static HTML fixture (`tests/fixtures/test-page.html`) with documented CSS values
- All extraction tests run against this fixture, assert exact values match
- Advantage: deterministic tests, fast (no real-world network), easy to debug assertions

## Critical Implementation Notes

### Injectable Scripts (Phase 2)
- **Most critical phase** — these are the core of the product
- Must handle: shadow DOM, CSS-in-JS, cross-origin stylesheets, very large pages (10k+ elements)
- Use error boundaries: never throw, return `{ styles: [], error: "reason" }` on failure
- CSS value parsing is nuanced: `rgb(26, 26, 46)` vs `rgba(26, 26, 46, 1)` vs hex vs hsl — normalize all to hex
- Box-shadow parsing: multi-layer shadows are comma-separated, each layer is `color offsetX offsetY blurRadius spreadRadius`
- Media query extraction from stylesheets: try/catch for cross-origin restrictions

### Playwright Orchestrator (Phase 2)
- Must handle auth: cookie injection from config JSON file before navigation
- Wait strategy: `page.goto(url, { waitUntil: 'networkidle' })` + optional `page.waitForSelector()`
- Breakpoint iteration: for each breakpoint, `page.setViewportSize({ width, height })` then wait 500ms for reflow
- Component state testing: use `element.hover()`, then re-extract styles for hover state
- Network recording: HAR capture requires starting `context.tracing` before goto

### CLI UX (Phase 4)
- Use `chalk` for colors (success=green, error=red, info=cyan) and `ora` for spinners
- Error messages should be actionable: "Playwright browsers not installed. Run: npx playwright install chromium"
- Summary tables after extraction: show counts (colors found, components, etc.) and output file paths
- Progress indication per module, not per element

### Report Generator (Phase 4)
- HTML report must be self-contained: inline all CSS, no external dependencies, no JS frameworks
- Include side-by-side screenshot overlays for each breakpoint (use CSS to layer original + rebuild at 50% opacity)
- Color swatches with hex + token name
- Component gallery: render HTML snippets (can be marked up with extracted CSS)
- Reconstruction checklist: checkboxes that persist in browser (localStorage or data-attributes)

## Next Steps (Fresh Laptop)

1. **Review** `.claude/plans/EXECUTION-ORDER.md` for window layout and exact commands
2. **Start Phase 1** in Window 1 with Opus model:
   ```
   Read .claude/plans/phase-1-foundation.md and execute it completely.
   ```
3. **After Phase 1 merges** to main:
   - **Start Phase 2** (Window 2, Opus): extraction scripts + extractors + orchestrator
   - **Start Phase 3** (Window 3, Sonnet): Claude skill + agents + install script (parallel with Phase 2)
4. **After Phases 2+3 merge**: Start Phase 4 (Window 4, Sonnet): CLI + generators
5. **After Phase 4 merges**: Start Phase 5 (Window 5, Sonnet): tests, fixtures, docs

## Known Constraints

- Phase 1 MUST complete first (all other phases depend on its types and file structure)
- Phases 2 and 3 can run in parallel but both depend on Phase 1
- Phase 4 depends on both Phases 2 and 3 being merged (needs all extraction logic + CLI framework)
- Playwright requires Node.js ≥18
- Injectable scripts must be valid JavaScript with zero Node.js dependencies (run in browser context)

## Useful Repo Context

- **Fresh repo**: just initialized, no commits except the plan files
- **Structure created**:
  - `.claude/plan.md` — master overview
  - `.claude/plans/` — 5 phase-specific plans
  - `thoughts/shared/logs/events.jsonl` — git activity log
- **Ready to branch from**: main, all plans committed
- **No external dependencies yet**: npm install happens in Phase 1

## Continuation

When starting fresh on new laptop:

```bash
cd ~/Documents/Repos/designmaxxing
git log --oneline  # should show: "docs: implementation plans for designmaxxing..."
cat .claude/plans/EXECUTION-ORDER.md  # shows exact window commands
```

All 5 phase plans are in git, ready to pull on any machine.
