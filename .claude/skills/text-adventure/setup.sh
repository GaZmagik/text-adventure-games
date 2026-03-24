#!/usr/bin/env bash
set -euo pipefail

# Install Bun if not present
if ! command -v bun &>/dev/null; then
	echo "Installing Bun..."
	# NOTE: Official Bun install script — executes remote code without checksum verification.
	# For higher-assurance environments, consider pinning a specific Bun release tarball with SHA-256 check.
	curl -fsSL https://bun.sh/install | bash
	export PATH="$HOME/.bun/bin:$PATH"
fi

# Ensure ~/.bun/bin is on PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Link the tag command globally
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bun link

if command -v tag &>/dev/null; then
	echo "'tag' command is ready."
else
	echo "Warning: 'tag' command not found. Ensure ~/.bun/bin is on your PATH."
fi

echo ""
echo "tag CLI installed successfully."
echo "Run 'tag state reset' to initialise a new game."
echo ""
echo "If 'tag' is not found, add this to your shell profile:"
echo "  export PATH=\"\$HOME/.bun/bin:\$PATH\""
