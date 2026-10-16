#!/usr/bin/env bash
# Generate an IndexNow key file in a site's public dir: scripts/indexnow-key.sh <public_dir>
# Prints only the key (public by design). Re-uses an existing key file if present.
set -euo pipefail
d=${1:?public dir}; f=$(ls "$d"/[0-9a-f]*.txt 2>/dev/null | grep -E '/[0-9a-f]{32}\.txt$' | head -1 || true)
if [ -z "$f" ]; then k=$(openssl rand -hex 16); printf '%s' "$k" > "$d/$k.txt"; else k=$(basename "$f" .txt); fi
echo "$k"
