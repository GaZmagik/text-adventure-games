#!/usr/bin/env bash
# Build the text-adventure.zip distribution archive.
# Run from the project root: ./scripts/zip.sh
#
# Playtest build (no published release tag needed):
#   git push origin HEAD && ./scripts/zip.sh --dev
# Flags: --dev (pin CDN to current HEAD commit) | --release <ref> | --user <gh-user>
#        --skip-ref-check (bypass the on-origin guard) | --print-ref (dry run, print ref)
#
# Excludes dev-only files that are not needed by skill consumers:
#   - *.spec.ts          (test files)
#   - .gitignore         (git-only)
#   - .tddignore         (TDD tooling)
#   - .prettierignore    (dev tooling)
#   - prettier.config.js (dev tooling)
#   - eslint.config.js   (dev tooling)
#   - knip.json          (dev tooling)
#   - bun.lock           (locks devDependencies only)
#   - cli/tests/         (test support harness and fixtures)
#   - cli/tsconfig.json  (typecheck only; Bun resolves types at runtime)
#   - scripts/           (build/check scripts not needed at runtime)
#   - docs/              (developer reference only)
#   - node_modules       (installed locally by setup.sh)
#   - coverage/          (test coverage output)
#   - bunfig.toml        (dev-only bun test config)
#   - .DS_Store          (macOS junk)
#   - *.lore.md          (plain-text lore; base64 variant is kept)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_DIR="$PROJECT_ROOT/.claude/skills/text-adventure"
OUTPUT="$PROJECT_ROOT/text-adventure.zip"

if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
	echo "Error: SKILL.md not found at $SKILL_DIR/SKILL.md" >&2
	exit 1
fi

# Determine the CDN ref the rendered widgets load their CSS/JS from.
# Precedence: --release <value> > --dev (current HEAD short SHA) > SKILL.md version tag > short commit hash.
#   --dev             pin to the current commit — no published release tag needed for playtesting
#   --skip-ref-check  bypass the "ref must be on origin" guard (release tag pushed afterwards, offline/CI)
#   --print-ref       print the resolved CDN ref and exit without building (dry run)
CURRENT_REF=""
DEV_MODE=0
SKIP_REF_CHECK=0
PRINT_REF=0
EXTRA_ARGS=()
i=1
while [ $i -le $# ]; do
	arg="${!i}"
	case "$arg" in
		--release)
			i=$((i + 1))
			CURRENT_REF="${!i}"
			;;
		--dev) DEV_MODE=1 ;;
		--skip-ref-check) SKIP_REF_CHECK=1 ;;
		--print-ref) PRINT_REF=1 ;;
		*) EXTRA_ARGS+=("$arg") ;;
	esac
	i=$((i + 1))
done

if [ -z "$CURRENT_REF" ]; then
	if [ "$DEV_MODE" -eq 1 ]; then
		CURRENT_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "main")
	else
		SKILL_VERSION=$(grep -m 1 "version: " "$SKILL_DIR/SKILL.md" | sed 's/.*version: //; s/["'\'']//g')
		if [ -n "$SKILL_VERSION" ]; then
			CURRENT_REF="v${SKILL_VERSION}"
		else
			echo "Warning: Could not detect version from SKILL.md, falling back to commit hash."
			CURRENT_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "main")
		fi
	fi
fi

# Guard: jsDelivr serves skill assets from GitHub, so a zip built against a ref
# that is not on origin produces widgets whose CSS/JS 404. Refuse it by default.
ref_on_origin() {
	local ref="$1" sha
	sha=$(git rev-parse --verify --quiet "${ref}^{commit}" 2>/dev/null) || return 1
	[ -n "$(git branch -r --contains "$sha" 2>/dev/null)" ]
}

if [ "$SKIP_REF_CHECK" -ne 1 ]; then
	if ! ref_on_origin "$CURRENT_REF"; then
		echo "Error: CDN ref '$CURRENT_REF' is not reachable on origin." >&2
		echo "  jsDelivr serves skill assets from GitHub; widgets built against an" >&2
		echo "  unpushed ref will 404. Push the commit first, then rebuild:" >&2
		echo "    git push origin HEAD" >&2
		echo "  Stale remote-tracking refs? run 'git fetch'. Building a release tag" >&2
		echo "  that gets pushed afterwards? pass --skip-ref-check." >&2
		exit 1
	fi
fi

if [ "$PRINT_REF" -eq 1 ]; then
	echo "$CURRENT_REF"
	exit 0
fi

ARGS=("--release" "$CURRENT_REF" "${EXTRA_ARGS[@]}")

echo "Building CDN assets (immutable ref: $CURRENT_REF)..."
cd "$SKILL_DIR/cli"
bun run tag.ts build-css "${ARGS[@]}" >/dev/null
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
if [ ! -f "$SKILL_DIR/assets/icons/sprite.svg" ]; then
	echo "Error: assets/icons/sprite.svg is missing" >&2
	exit 1
fi

# Remove any stale zip only now — after the --print-ref / guard short-circuits —
# so a dry run or a refused build never deletes the existing artifact.
rm -f "$OUTPUT"
zip -r "$OUTPUT" . \
	-x "*.DS_Store" \
	-x "*.spec.ts" \
	-x "bunfig.toml" \
	-x "cli/bunfig.toml" \
	-x "cli/tsconfig.json" \
	-x ".gitignore" \
	-x ".tddignore" \
	-x ".prettierignore" \
	-x "prettier.config.js" \
	-x "eslint.config.js" \
	-x "knip.json" \
	-x "bun.lock" \
	-x "node_modules/*" \
	-x "cli/tests/*" \
	-x "cli/commands/dev.ts" \
	-x "scripts/*" \
	-x "docs/*" \
	-x "playwright.config.ts" \
	-x "playwright-report/*" \
	-x "test-results/*" \
	-x "scratch/*" \
	-x "assets/css/*" \
	-x "assets/js/*" \
	-x "assets/icons/*" \
	-x "icons/*" \
	-x "coverage/*" \
	-x "text-adventure.zip" \
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
