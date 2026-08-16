#!/usr/bin/env bash
# Fetch Linux x64 optional native packages and rebuild node-pty on Ubuntu.
set -euo pipefail
build_root="$(cd "$(dirname "$0")" && pwd)"
host_root="$build_root/resources/host"
nm="$host_root/node_modules"
if [[ ! -f "$nm/@deepseek-ai/dsh/lib/bin.js" ]]; then
  echo "assembled host missing at $host_root" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
echo "==> installing Linux x64 native optional packages"
(
  cd "$tmp"
  npm init -y >/dev/null
  npm install --omit=dev --no-audit --no-fund \
    @img/sharp-linux-x64@0.35.3 \
    @koromix/koffi-linux-x64@3.1.5 \
    node-addon-require-builtin-linux-x64-gnu@0.1.5
)
for rel in \
  @img/sharp-linux-x64 \
  @img/sharp-libvips-linux-x64 \
  @koromix/koffi-linux-x64 \
  node-addon-require-builtin-linux-x64-gnu
do
  if [[ -d "$tmp/node_modules/$rel" ]]; then
    rm -rf "$nm/$rel"
    mkdir -p "$(dirname "$nm/$rel")"
    cp -R "$tmp/node_modules/$rel" "$nm/$rel"
    echo "  $rel"
  fi
done

echo "==> rebuilding node-pty for this Linux"
if [[ ! -d "$nm/node-pty" ]]; then
  echo "host tree has no node-pty" >&2
  exit 1
fi
(
  cd "$nm/node-pty"
  npm rebuild --foreground-scripts
)

for rel in \
  @img/sharp-linux-x64/package.json \
  @koromix/koffi-linux-x64/package.json \
  node-addon-require-builtin-linux-x64-gnu/package.json
do
  if [[ ! -e "$nm/$rel" ]]; then
    echo "linux native missing after install: $rel" >&2
    exit 1
  fi
done
echo "==> linux natives ready"
