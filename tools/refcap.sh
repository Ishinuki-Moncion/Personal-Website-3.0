#!/usr/bin/env bash
# refcap.sh — capture a reference image into the git-ignored study board.
# Usage: refcap.sh <surface> <image-url> <label>
set -uo pipefail
surface="${1:?surface}"; url="${2:?url}"; label="${3:-ref}"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
dir="$repo_root/docs/superpowers/research/refs/$surface"
mkdir -p "$dir"
count=$(ls "$dir"/[0-9]*.* 2>/dev/null | wc -l | tr -d ' ')
n=$(printf '%03d' "$((count + 1))")
ext="${url##*.}"; ext="${ext%%\?*}"; case "$ext" in jpg|jpeg|png|webp|gif|avif) ;; *) ext="jpg" ;; esac
out="$dir/${n}-${label}.${ext}"
if curl -fsSL --max-time 30 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36" -o "$out" "$url"; then
  sips -Z 1400 "$out" >/dev/null 2>&1 || true
  printf '%s\t%s\n' "${out#$repo_root/}" "$url" >> "$dir/SOURCES.tsv"
  echo "captured: ${out#$repo_root/}"
else
  echo "FAILED (try alt source or MCP fallback): $url" >&2; exit 1
fi
