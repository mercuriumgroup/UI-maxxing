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

- **Decision**: 5-phase build plan in `.claude/plans/`. Phase 1 (foundation) complete, Phase 2 (extractors) complete, Phase 3 (Claude integration) complete, phases 4-5 pending.
- **Rationale**: Each phase is independently testable and commitable.

### ADR-004: Browser-injectable JS scripts / 2026-04-01

- **Decision**: Extraction logic lives in `src/scripts/*.js` (plain JS, not TS) and is loaded into pages via Playwright's `page.evaluate()`. A `ScriptLoader` resolves paths for both dev and packaged usage.
- **Rationale**: `page.evaluate()` requires serializable functions; keeping extraction logic in separate `.js` files makes them inspectable and testable independently of Playwright.

### ADR-005: Claude Code integration via `claude/` directory / 2026-04-01

- **Decision**: Skill and agent markdown files live in `claude/skill/` and `claude/agents/` and are copied to `~/.claude/` by `scripts/install-claude.sh` (also runnable via `npm run install-claude`).
- **Rationale**: Keeps Claude integration in the repo alongside the tool it controls. Install script is idempotent.

## Conventions

<!-- Discovered by pattern-finder or established by the team -->
<!-- Format: - **[Convention]**: [Description] (source: [file:line]) -->

- **Extractor pattern**: Each module extends `BaseExtractor<TResult>`, implements `extract()`, gets page via `setPage()` (source: src/extractors/base.ts)
- **Generator pattern**: Pure functions that take extraction results and return formatted output (source: src/generators/)
- **Type-first**: All interfaces defined in `src/types/` before implementation. Readonly properties throughout.
- **Zod config**: Runtime validation via `ConfigSchema` and `VerifyConfigSchema` (source: src/types/config.ts)

## Known Issues

<!-- Format: - **[Issue]**: [Description] — Workaround: [workaround] -->

- **No test files yet**: Vitest is configured with `passWithNoTests: true` (`src/**/*.test.ts` pattern). Tests will be added in Phase 5.

## Rejected Alternatives

<!-- Things we tried and decided against — prevents revisiting dead ends -->
<!-- Format: - **[Alternative]**: [Why rejected] (date: [DATE]) -->

## Topic Index

<!-- Links to detailed memory files in memory/topics/ -->
<!-- Format: - [topic-name](topics/topic-name.md) — [one-line description] -->
