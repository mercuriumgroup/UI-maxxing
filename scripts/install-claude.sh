#!/usr/bin/env bash
# Install designmaxxing Claude Code skill and agents into ~/.claude/
# Safe to run multiple times (idempotent).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
CLAUDE_DIR="${HOME}/.claude"

echo "Installing designmaxxing Claude Code integration..."
echo ""

# Create target directories
mkdir -p "${CLAUDE_DIR}/skills/designmaxxing"
mkdir -p "${CLAUDE_DIR}/agents"

# Copy skill
cp "${PACKAGE_DIR}/claude/skill/SKILL.md" "${CLAUDE_DIR}/skills/designmaxxing/SKILL.md"
echo "  Installed skill: /designmaxxing"

# Copy all agents
for agent in "${PACKAGE_DIR}/claude/agents/"*.md; do
  name=$(basename "$agent")
  cp "$agent" "${CLAUDE_DIR}/agents/${name}"
  echo "  Installed agent: ${name%.md}"
done

echo ""
echo "Installation complete! Start a new Claude Code session, then use:"
echo ""
echo "  /designmaxxing <url>           Extract design data from any web page"
echo "  /designmaxxing reconstruct     Start guided pixel-perfect UI reconstruction"
echo "  /designmaxxing verify <url>    Compare your rebuild against the original"
echo "  /designmaxxing report          Generate an extraction summary report"
