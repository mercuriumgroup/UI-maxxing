# Core Memory

> This is the project's persistent memory. Append new entries — don't delete old ones.
> Claude reads this at the start of every session to maintain continuity.

## Project Identity

- **Name**: designmaxxing
- **Created**: 2026-04-01
- **Type**: Standalone CLI tool (NOT a web app / NOT Next.js)
- **Stack**: TypeScript, Playwright, Commander, Zod, Vitest
- **Purpose**: Pixel-perfect UI reverse engineering toolkit — extract design tokens, components, and layout from any web app

## Build Commands

```bash
install: npm install
dev:     npm run dev
test:    npm run test       # vitest, colocated src/**/*.test.ts, passWithNoTests=true
lint:    npm run lint
build:   npm run build      # rm -rf dist && tsc && cp src/scripts/*.js dist/scripts/
```

## Architecture Decision Records

<!-- Format: ### ADR-001: [Title] / Date / Decision / Rationale -->

### ADR-001: ESM-only package / 2026-04-01

- **Decision**: `"type": "module"` in package.json, ES2022 target, bundler moduleResolution
- **Rationale**: All dependencies support ESM. No CJS consumers expected.

### ADR-002: Shared browser instance via orchestrator / 2026-04-01

- **Decision**: Single Playwright browser launched by orchestrator, page passed to extractors via `setPage()`
- **Rationale**: Avoids cold-starting a browser per module. Extractors share the same page state.

### ADR-003: Phased implementation plan / 2026-04-01 — PHASE 4 COMPLETE

- **Decision**: 5-phase build plan in `.claude/plans/`. Phase 1 (foundation) complete, Phase 2 (extractors) complete, Phase 3 (orchestrator) complete, Phase 4 (CLI + generators) complete. Phase 5 (polish + docs) pending.
- **Rationale**: Each phase is independently testable and commitable.

### ADR-004: Injectable scripts as plain .js files / 2026-04-01

- **Decision**: Browser-injectable scripts live in `src/scripts/*.js` (not `.ts`), copied verbatim to `dist/scripts/` at build time.
- **Rationale**: Scripts run inside the target page's browser context — no Node.js, no TypeScript, no imports. tsc doesn't process them; the build script copies them explicitly.

### ADR-005: DOM lib in tsconfig / 2026-04-01

- **Decision**: Added `"DOM"` to `tsconfig.json` lib array.
- **Rationale**: `page.evaluate()` callbacks reference DOM globals (getComputedStyle, window, document). Without DOM lib, TypeScript errors on these. The tool is inherently DOM-aware.

## Conventions

<!-- Discovered by pattern-finder or established by the team -->
<!-- Format: - **[Convention]**: [Description] (source: [file:line]) -->

- **Extractor pattern**: Each module extends `BaseExtractor<TResult>`, implements `extract()`, gets page via `setPage()`. Use `this.runScript('script-name.js', args)` to inject scripts. (source: src/extractors/base.ts)
- **Script pattern**: Each injectable script defines a single `__extract(args)` function. Loaded at runtime by `script-loader.ts` which checks `dist/scripts/` then `src/scripts/`. (source: src/extractors/script-loader.ts)
- **Generator pattern**: Pure functions that take extraction results and return formatted output. Exception: `generateReport()` is async due to file I/O for screenshot embedding. (source: src/generators/)
- **CLI command factory pattern**: CLI commands exported as `createXxxCommand(): Command` factory functions. (source: src/cli/)
- **Cleanup pattern**: Graceful shutdown via `registerCleanup(fn)` / `runCleanup()`. Used for browser teardown and resource cleanup. (source: src/cli/cleanup.ts)
- **Type-first**: All interfaces defined in `src/types/` before implementation. Readonly properties throughout.
- **Zod config**: Runtime validation via `ConfigSchema` and `VerifyConfigSchema` (source: src/types/config.ts)

## Known Issues

<!-- Format: - **[Issue]**: [Description] — Workaround: [workaround] -->

## Rejected Alternatives

<!-- Things we tried and decided against — prevents revisiting dead ends -->
<!-- Format: - **[Alternative]**: [Why rejected] (date: [DATE]) -->

## Topic Index

<!-- Links to detailed memory files in memory/topics/ -->
<!-- Format: - [topic-name](topics/topic-name.md) — [one-line description] -->
