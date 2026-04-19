#!/usr/bin/env bash
# Build the text-adventure.zip distribution archive.
# Run from the project root: ./scripts/zip.sh
#
# Excludes dev-only files that are not needed by skill consumers:
#   - *.spec.ts    (test files)
#   - .gitignore   (git-only)
#   - .tddignore   (TDD tooling)
#   - bun.lock     (locks devDependencies only)
#   - cli/tests/   (test support harness and fixtures)
#   - node_modules (installed locally by setup.sh)
#   - coverage/    (test coverage output)
#   - bunfig.toml  (dev-only bun test config)
#   - .DS_Store    (macOS junk)
#   - *.lore.md    (plain-text lore; base64 variant is kept)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_DIR="$PROJECT_ROOT/.claude/skills/text-adventure"
OUTPUT="$PROJECT_ROOT/text-adventure.zip"

if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
	echo "Error: SKILL.md not found at $SKILL_DIR/SKILL.md" >&2
	exit 1
fi

# Remove old zip to ensure a clean build (zip -r updates in-place)
rm -f "$OUTPUT"

# Pre-build: regenerate CDN CSS assets + manifest
if [ $# -gt 0 ]; then
	echo "Running tag build-css $*..."
else
	echo "Running tag build-css..."
fi
cd "$SKILL_DIR/cli"
bun run tag.ts build-css "$@" >/dev/null
cd "$SKILL_DIR"

# Sanity check: CDN assets exist
if [ ! -d "$SKILL_DIR/assets/css" ] || [ -z "$(ls "$SKILL_DIR/assets/css"/*.css 2>/dev/null)" ]; then
	echo "Error: assets/css/ is empty — tag build-css may have failed" >&2
	exit 1
fi
if [ ! -f "$SKILL_DIR/assets/js/tag-scene.js" ] || [ ! -f "$SKILL_DIR/assets/js/tag-soundscape.js" ]; then
	echo "Error: assets/js/ is missing CDN JS files" >&2
	exit 1
fi

zip -r "$OUTPUT" . \
	-x "*.DS_Store" \
	-x "*.spec.ts" \
	-x "bunfig.toml" \
	-x "cli/bunfig.toml" \
	-x ".gitignore" \
	-x ".tddignore" \
	-x "bun.lock" \
	-x "node_modules/*" \
	-x "cli/tests/*" \
	-x "assets/css/*" \
	-x "assets/js/*" \
	-x "coverage/*" \
	-x "*.lore.md"

# Re-add base64 lore files (*.lore.md exclusion above catches them too)
find . -name '*.base64.lore.md' -print0 | xargs -0 zip -g "$OUTPUT" 2>/dev/null || true

FILE_COUNT=$(unzip -l "$OUTPUT" | tail -1 | awk '{print $2}')
SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')

echo ""
echo "Built: $OUTPUT"
echo "Files: $FILE_COUNT | Size: $SIZE"

# Sanity check: no .spec.ts files should be in the archive
SPEC_COUNT=$(unzip -l "$OUTPUT" | grep -c '\.spec\.ts' || true)
if [ "$SPEC_COUNT" -gt 0 ]; then
	echo "WARNING: $SPEC_COUNT .spec.ts files found in archive!" >&2
	exit 1
fi

echo "Verified: no .spec.ts files in archive."
