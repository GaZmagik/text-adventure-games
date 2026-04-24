#!/bin/sh
# Text Adventure Games — tag CLI setup
# Source this file: . ./setup.sh
# Works in bash, zsh, dash, and /bin/sh (POSIX compatible)
set -eu

# Install Bun if not present
if ! command -v bun >/dev/null 2>&1; then
	echo "Installing Bun..."
	# NOTE: Official Bun install script — executes remote code without checksum verification.
	# For higher-assurance environments, consider pinning a specific Bun release tarball with SHA-256 check.
	_TAG_BUN_INSTALL_SCRIPT="${TMPDIR:-/tmp}/tag-bun-install.$$"
	_TAG_BUN_ATTEMPT=1
	while [ "$_TAG_BUN_ATTEMPT" -le 3 ]; do
		if curl -fsSL https://bun.sh/install -o "$_TAG_BUN_INSTALL_SCRIPT" && sh "$_TAG_BUN_INSTALL_SCRIPT"; then
			break
		fi
		if [ "$_TAG_BUN_ATTEMPT" -lt 3 ]; then
			echo "Bun install failed; retrying in 10 seconds..." >&2
			sleep 10
		fi
		_TAG_BUN_ATTEMPT=$((_TAG_BUN_ATTEMPT + 1))
	done
	rm -f "$_TAG_BUN_INSTALL_SCRIPT"
	unset _TAG_BUN_ATTEMPT
	unset _TAG_BUN_INSTALL_SCRIPT
	if ! command -v bun >/dev/null 2>&1; then
		echo "Bun install failed after 3 attempts." >&2
		return 1 2>/dev/null || exit 1
	fi
	export PATH="$HOME/.bun/bin:$PATH"
fi

# Ensure ~/.bun/bin is on PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Resolve the skill directory (works when sourced from any shell)
# BASH_SOURCE is bash-only; fall back to $0 for POSIX shells, then to pwd
if [ -n "${BASH_SOURCE:-}" ]; then
	_TAG_SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
elif [ -f "$0" ] && [ "$(basename "$0")" = "setup.sh" ]; then
	_TAG_SETUP_DIR="$(cd "$(dirname "$0")" && pwd)"
else
	_TAG_SETUP_DIR="$(pwd)"
fi

# Link the tag command (suppress bun link's project-usage guidance)
cd "$_TAG_SETUP_DIR"
bun link 2>&1 | grep -v "^$\|To use\|Or add\|bun link" || true

# Symlink bun and tag into /usr/local/bin so they survive fresh shell processes
# (each bash tool call on Claude.ai is a separate process — env vars don't persist)
_TAG_BUN_BIN="$HOME/.bun/bin"
if [ -d /usr/local/bin ] && [ -w /usr/local/bin ]; then
	ln -sf "$_TAG_BUN_BIN/bun" /usr/local/bin/bun 2>/dev/null || true
	ln -sf "$_TAG_BUN_BIN/tag" /usr/local/bin/tag 2>/dev/null || true
else
	echo "Note: /usr/local/bin is not writable. Run these to make tag available globally:"
	echo "  sudo ln -sf $_TAG_BUN_BIN/bun /usr/local/bin/bun"
	echo "  sudo ln -sf $_TAG_BUN_BIN/tag /usr/local/bin/tag"
fi
unset _TAG_BUN_BIN

if command -v tag >/dev/null 2>&1; then
	echo "tag CLI ready. Run 'tag state reset' to start a new game."
else
	echo "Warning: 'tag' not found. Add to your shell profile:"
	echo "  export PATH=\"\$HOME/.bun/bin:\$PATH\""
fi

# Clean up temp variable
unset _TAG_SETUP_DIR
