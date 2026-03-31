# Phase 3: Claude Code Integration — Skill + Sub-Agents

**Model**: Sonnet (knowledge authoring, not deep code reasoning)
**Branch**: `feat/claude-integration`
**Estimated time**: 30 minutes
**Dependencies**: Phase 1 must be merged to main
**Can run in parallel with**: Phase 2

## Objective

Create the `/designmaxxing` Claude Code skill and 4 specialized sub-agents. Also create the install script that copies these into any user's `~/.claude/` directory.

## Pre-flight

```bash
git checkout main && git pull
git checkout -b feat/claude-integration
```

## Step 1: Master Skill — `claude/skill/SKILL.md`

This is the entry point invoked by `/designmaxxing <url>`. Create `claude/skill/SKILL.md`:

```yaml
---
name: designmaxxing
description: "Pixel-perfect UI reverse engineering. Extract design tokens, components, layout, and assets from any web app. Usage: /designmaxxing <url>"
---
```

The skill body should contain:

### Skill Logic

1. **Parse the user's input** — extract the URL (required) and any flags
2. **Validate the URL** — must be a valid http/https URL
3. **Run extraction** — spawn the `designmaxxing-extractor` agent with:
   - The URL
   - Any specified modules (default: all)
   - Output directory (default: `./designmaxxing-output`)
4. **Run analysis** — after extraction completes, spawn the `designmaxxing-analyzer` agent to:
   - Read all extraction JSON
   - Generate design tokens
   - Generate component inventory
   - Identify patterns and anomalies
   - Produce analysis report
5. **Present results** — summarize what was extracted:
   - Number of colors, typography entries, components, assets
   - Framework detection results
   - Key findings (spacing scale detected, design system patterns)
   - Paths to all output files
6. **Offer next steps**:
   - "Run `/designmaxxing reconstruct` to start rebuilding from extracted data"
   - "Run `/designmaxxing verify <rebuild-url>` to compare your rebuild against the original"

### Usage Patterns in Skill

```
/designmaxxing https://stripe.com/payments
/designmaxxing https://linear.app --modules visual,typography,layout
/designmaxxing https://example.com --output ./my-extraction
/designmaxxing reconstruct            # starts reconstruction guidance
/designmaxxing verify http://localhost:3000  # compares rebuild vs original
/designmaxxing report                  # generates HTML report from last extraction
```

### Skill Content Guidelines

- The skill should be comprehensive (200-400 lines)
- Include all the extraction methodology from our research as inline reference
- Include the DevTools console scripts as reference material the agents can use
- Document every CLI flag and option
- Include troubleshooting section (CORS issues, auth-gated pages, SPA rendering)
- Include the master reconstruction checklist from the research

## Step 2: Agent — `claude/agents/designmaxxing-extractor.md`

```yaml
---
name: designmaxxing-extractor
description: "Runs the designmaxxing extraction pipeline against a target URL. Handles Playwright browser automation, captures computed styles, assets, and page structure. Use when extracting design data from a web page."
tools: Read, Write, Bash, Glob, Grep
model: sonnet
---
```

Agent body should include:

**Role**: You are a web extraction specialist. You run the `designmaxxing` CLI tool to extract design data from web pages.

**Workflow**:
1. Check that `designmaxxing` is installed (`npx designmaxxing --version` or local)
2. If not installed, install from the project's package.json or npm
3. Run `npx designmaxxing extract <url>` with the specified flags
4. Monitor stdout/stderr for errors
5. On success: read the extraction manifest (`extraction.json`) and summarize results
6. On failure: diagnose the issue:
   - Timeout → suggest increasing `--timeout` or adding `--wait-for-selector`
   - Auth error → suggest `--auth-cookies` flag
   - CORS → note which assets couldn't be downloaded
   - Playwright not installed → run `npx playwright install chromium`

**Error recovery patterns**:
- If Playwright browsers not installed: `npx playwright install chromium`
- If page requires auth: guide user to export cookies (provide instructions for Chrome cookie export)
- If SPA content not loaded: suggest `--wait-for-selector ".main-content"` flag
- If extraction is partial: report which modules succeeded vs failed

**Output format**: After extraction, provide a structured summary:
```
## Extraction Complete

**URL**: https://example.com
**Output**: ./designmaxxing-output/
**Modules**: visual, typography, layout, components, assets, animations, behavior, framework, network

### Results
- Colors: 24 unique values extracted
- Typography: 8 scale entries, 3 font families
- Layout: 12 flex containers, 3 grid containers, 4 breakpoints
- Components: 34 component boundaries detected
- Assets: 12 images, 8 SVGs, 2 font families downloaded
- Animations: 6 transitions, 2 keyframe animations
- Framework: Next.js (React), Tailwind CSS, Radix UI

### Files
- extraction.json (manifest)
- visual.json, typography.json, layout.json, ...
- assets/fonts/, assets/images/, assets/svgs/
- screenshots/375.png, screenshots/768.png, ...
```

## Step 3: Agent — `claude/agents/designmaxxing-analyzer.md`

```yaml
---
name: designmaxxing-analyzer
description: "Analyzes designmaxxing extraction data to identify design system patterns, generate tokens, and produce insights. Use after extraction to interpret raw data into actionable design decisions."
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---
```

Agent body should include:

**Role**: You are a design system analyst. You read raw extraction data and identify patterns, scales, naming conventions, and anomalies.

**Workflow**:
1. Read `extraction.json` manifest to understand what was extracted
2. Read each module's JSON output
3. **Color analysis**:
   - Cluster similar colors (likely same intended color with anti-aliasing variance)
   - Identify semantic roles: primary, secondary, accent, background, text, border, success, warning, error
   - Suggest token names based on usage context
4. **Typography analysis**:
   - Identify the type scale (heading sizes, body, caption, etc.)
   - Map font families to roles (heading font, body font, monospace)
   - Detect line-height and letter-spacing patterns
5. **Spacing analysis**:
   - Extract all unique margin/padding values
   - Detect the base unit (4px, 8px, etc.)
   - Build a spacing scale
6. **Layout analysis**:
   - Identify the page grid system
   - Document container max-widths
   - Map breakpoint behavior changes
7. **Component analysis**:
   - Name components based on their structure and role
   - Group related components (card variants, button variants)
   - Document state transitions
8. **Write outputs**:
   - `tokens.json` — structured design tokens
   - `tokens.css` — CSS custom properties
   - `tailwind.config.ts` — Tailwind theme extension (if Tailwind detected)
   - `analysis.md` — human-readable analysis with findings and recommendations
   - `component-inventory.json` — named component catalog

**Pattern detection heuristics**:
- If all spacing values are multiples of 4: base unit is 4px
- If all spacing values are multiples of 8: base unit is 8px
- If font sizes follow a ratio (1.125, 1.25, 1.333, 1.5, 1.618): identify the scale type (minor third, major third, perfect fourth, etc.)
- If colors are clustered within deltaE < 3: they're likely the same intended color

## Step 4: Agent — `claude/agents/designmaxxing-reconstructor.md`

```yaml
---
name: designmaxxing-reconstructor
description: "Guides pixel-perfect UI reconstruction from extracted design data. Generates starter code, component skeletons, and layout scaffolds based on extraction results. Use after analysis to start rebuilding."
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---
```

Agent body should include:

**Role**: You are a UI reconstruction specialist. You take extracted design data and guide the user through rebuilding the UI pixel-perfectly.

**Workflow**:
1. Read extraction data + analysis outputs
2. Determine the target stack (ask user or infer from their project's package.json)
3. **Generate foundation files**:
   - CSS custom properties file (or Tailwind config) from tokens
   - Global styles (reset, base typography, body defaults)
   - Layout shell component (header/main/footer structure)
4. **Build components bottom-up** (atoms → molecules → organisms):
   - For each component in the inventory:
     - Generate the component file with extracted styles
     - Include all state variants (hover, focus, active, disabled)
     - Apply exact spacing, colors, typography from tokens
     - Include animation/transition CSS
5. **Responsive implementation**:
   - Implement layout changes at each detected breakpoint
   - Use extracted grid/flex configurations exactly
6. **Reference screenshots**:
   - Point to extracted screenshots for visual verification
   - Suggest running the verifier after each major section

**Reconstruction order** (the master checklist from research):
1. Design tokens (colors, typography, spacing, shadows, radii)
2. Global styles + reset
3. Layout shell (page grid, header, footer, sidebar)
4. Atomic components (buttons, inputs, badges, icons)
5. Compound components (cards, forms, navigation, modals)
6. Page sections (hero, features, pricing, etc.)
7. Responsive adjustments per breakpoint
8. Interactions (hover states, transitions, animations)
9. Behavior (scroll effects, form validation, dynamic states)

## Step 5: Agent — `claude/agents/designmaxxing-verifier.md`

```yaml
---
name: designmaxxing-verifier
description: "Runs visual regression testing between an original URL and a rebuild URL. Compares screenshots at multiple breakpoints and reports pixel-level differences. Use to verify reconstruction accuracy."
tools: Read, Write, Bash, Glob, Grep
model: sonnet
---
```

Agent body should include:

**Role**: You are a visual QA specialist. You compare an original website against a rebuilt version and identify every discrepancy.

**Workflow**:
1. Run `npx designmaxxing verify <original-url> <rebuild-url>`
2. Read the comparison results
3. For each breakpoint:
   - Report pixel diff percentage
   - Identify specific regions with differences
   - Categorize issues: spacing, color, typography, layout, missing elements
4. Prioritize fixes:
   - CRITICAL: Layout shifts, missing components, wrong grid structure
   - HIGH: Color mismatches, font size/weight differences
   - MEDIUM: Shadow, border-radius, opacity differences
   - LOW: Sub-pixel rendering differences, anti-aliasing variance
5. For each issue, suggest the specific CSS fix based on extracted data

**Verification thresholds**:
- < 1% pixel diff: PASS — pixel-perfect
- 1-2% pixel diff: NEAR — minor tweaks needed
- 2-5% pixel diff: PARTIAL — significant differences
- > 5% pixel diff: FAIL — major reconstruction issues

## Step 6: Install Script — `scripts/install-claude.sh`

```bash
#!/usr/bin/env bash
# Install designmaxxing Claude Code skill and agents

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
CLAUDE_DIR="${HOME}/.claude"

echo "Installing designmaxxing Claude Code integration..."

# Create directories if needed
mkdir -p "${CLAUDE_DIR}/skills/designmaxxing"
mkdir -p "${CLAUDE_DIR}/agents"

# Copy skill
cp "${PACKAGE_DIR}/claude/skill/SKILL.md" "${CLAUDE_DIR}/skills/designmaxxing/SKILL.md"
echo "  Installed skill: /designmaxxing"

# Copy agents
for agent in "${PACKAGE_DIR}/claude/agents/"*.md; do
  name=$(basename "$agent")
  cp "$agent" "${CLAUDE_DIR}/agents/${name}"
  echo "  Installed agent: ${name%.md}"
done

echo ""
echo "Done! Available commands:"
echo "  /designmaxxing <url>     — Extract design data from any web page"
echo "  /designmaxxing reconstruct — Start guided UI reconstruction"
echo "  /designmaxxing verify <url> — Compare rebuild against original"
echo "  /designmaxxing report    — Generate extraction report"
```

Also add to `package.json`:
```json
{
  "scripts": {
    "install-claude": "bash scripts/install-claude.sh"
  }
}
```

And add a CLI command: `designmaxxing install-claude` that runs the same script.

## Step 7: Verify & Commit

```bash
# Check all files are well-formed markdown
cat claude/skill/SKILL.md | head -5  # verify frontmatter
cat claude/agents/designmaxxing-extractor.md | head -5
cat claude/agents/designmaxxing-analyzer.md | head -5
cat claude/agents/designmaxxing-reconstructor.md | head -5
cat claude/agents/designmaxxing-verifier.md | head -5

# Test install script
bash scripts/install-claude.sh

# Verify installed
ls ~/.claude/skills/designmaxxing/
ls ~/.claude/agents/designmaxxing-*

npm run build  # ensure no TS errors introduced
```

```bash
git add -A
git commit -m "feat: Claude Code integration — /designmaxxing skill + 4 sub-agents + install script"
git push -u origin feat/claude-integration
```

## Completion Criteria

- [ ] SKILL.md is comprehensive (200+ lines) with all usage patterns documented
- [ ] All 4 agents have correct frontmatter (name, description, tools, model)
- [ ] Each agent has a clear workflow, error handling, and output format
- [ ] Install script copies all files to correct locations
- [ ] Install script is idempotent (safe to run multiple times)
- [ ] `npm run build` still passes
- [ ] Agents reference the correct CLI commands
- [ ] Skill includes the full extraction methodology as reference material
