# Designmaxxing — Parallel Execution Guide

## Window Layout

Run these plans in separate Claude Code windows. Phases 1-3 have dependencies — Phase 1 MUST complete first (it creates the project structure everything else depends on). Phases 2 and 3 can run in parallel after Phase 1 merges. Phases 4 and 5 run after 2+3 merge.

```
TIMELINE:
═══════════════════════════════════════════════════════════════

Phase 1 (Foundation)          ████████░░░░░░░░░░░░░░░░░░░░░░
  Window 1 · Opus · 30 min     ^ merges to main

Phase 2 (Extractors)         ░░░░░░░░████████████░░░░░░░░░░░
  Window 2 · Opus · 60 min              ^ merges

Phase 3 (Claude Integration) ░░░░░░░░████████░░░░░░░░░░░░░░░
  Window 3 · Sonnet · 30 min        ^ merges

Phase 4 (CLI + Generators)   ░░░░░░░░░░░░░░░░░░██████████░░░
  Window 4 · Sonnet · 45 min                      ^ merges

Phase 5 (Tests + Polish)     ░░░░░░░░░░░░░░░░░░░░░░░░████████
  Window 5 · Sonnet · 30 min                            ^ done

═══════════════════════════════════════════════════════════════
```

## Commands Per Window

```bash
# Window 1 — START FIRST
cd ~/Documents/Repos/designmaxxing
claude --model opus "Read .claude/plans/phase-1-foundation.md and execute it completely. This is a fresh repo — you are creating the project from scratch."

# Window 2 — START AFTER PHASE 1 MERGES
cd ~/Documents/Repos/designmaxxing
git pull
claude --model opus "Read .claude/plans/phase-2-extractors.md and execute it completely. Phase 1 foundation is already built."

# Window 3 — CAN START AFTER PHASE 1 MERGES (parallel with Window 2)
cd ~/Documents/Repos/designmaxxing
git pull
claude --model sonnet "Read .claude/plans/phase-3-claude-integration.md and execute it completely. Phase 1 foundation is already built."

# Window 4 — START AFTER PHASES 2+3 MERGE
cd ~/Documents/Repos/designmaxxing
git pull
claude --model sonnet "Read .claude/plans/phase-4-cli-generators.md and execute it completely. Phases 1-3 are built."

# Window 5 — START AFTER PHASE 4 MERGES
cd ~/Documents/Repos/designmaxxing
git pull
claude --model sonnet "Read .claude/plans/phase-5-tests-polish.md and execute it completely. All source code is built."
```

## Branch Strategy

Each phase works on its own branch and creates a PR:
- Phase 1: `feat/foundation` → main
- Phase 2: `feat/extractors` → main
- Phase 3: `feat/claude-integration` → main
- Phase 4: `feat/cli-generators` → main
- Phase 5: `feat/tests-polish` → main
