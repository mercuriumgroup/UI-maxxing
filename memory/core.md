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
test:    npm run test
lint:    npm run lint
build:   npm run build
```

## Architecture Decision Records

<!-- Format: ### ADR-001: [Title] / Date / Decision / Rationale -->

### ADR-001: ESM-only package / 2026-04-01

- **Decision**: `"type": "module"` in package.json, ES2022 target, bundler moduleResolution
- **Rationale**: All dependencies support ESM. No CJS consumers expected.

### ADR-002: Shared browser instance via orchestrator / 2026-04-01

- **Decision**: Single Playwright browser launched by orchestrator, page passed to extractors via `setPage()`
- **Rationale**: Avoids cold-starting a browser per module. Extractors share the same page state.

### ADR-003: Phased implementation plan / 2026-04-01

- **Decision**: 5-phase build plan in `.claude/plans/`. Phase 1 (foundation) complete, phases 2-5 pending.
- **Rationale**: Each phase is independently testable and commitable.

## Conventions

<!-- Discovered by pattern-finder or established by the team -->
<!-- Format: - **[Convention]**: [Description] (source: [file:line]) -->

- **Extractor pattern**: Each module extends `BaseExtractor<TResult>`, implements `extract()`, gets page via `setPage()` (source: src/extractors/base.ts)
- **Generator pattern**: Pure functions that take extraction results and return formatted output (source: src/generators/)
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
