#!/usr/bin/env bash
set -euo pipefail

# Install Bun if not present
if ! command -v bun &>/dev/null; then
	echo "Installing Bun..."
	curl -fsSL https://bun.sh/install | bash
	export PATH="$HOME/.bun/bin:$PATH"
fi

# Ensure ~/.bun/bin is on PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Link the tag command globally
cd "$(dirname "$0")"
bun link

echo ""
echo "tag CLI installed successfully."
echo "Run 'tag state reset' to initialise a new game."
echo ""
echo "If 'tag' is not found, add this to your shell profile:"
echo "  export PATH=\"\$HOME/.bun/bin:\$PATH\""
