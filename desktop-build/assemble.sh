#!/usr/bin/env bash
# Assemble host patches and pack Linux desktop artifacts.
# Usage: bash desktop-build/assemble.sh [linux]
set -euo pipefail
target="${1:-linux}"
build_root="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$build_root/.." && pwd)"
host_root="$build_root/resources/host"
ai_root="$host_root/node_modules/@deepseek-ai"
if [[ ! -f "$ai_root/dsh/lib/bin.js" ]]; then
  echo "staging host not found at $host_root" >&2
  exit 1
fi

echo "==> applying this fork's patches onto the packaged host"
patches=(
  "dsh-session|packages/core/session"
  "dsh-llm|packages/llm/llm"
  "dsh-llm-pi-ai|packages/llm/llm-pi-ai"
  "dsh-host-apiproxy|packages/host/apiproxy"
  "dsh-tool-cordis|packages/extensions/tool-cordis"
  "dsh-cordis-client-runner|packages/extensions/cordis-client-runner"
  "dsh-client-ui-settings-models|packages/client/ui-settings-models"
  "dsh-client-connection|packages/client/connection"
  "dsh-client-ui-desktop-customization|desktop-studio/plugins/dsh-client-ui-desktop-customization"
)
for spec in "${patches[@]}"; do
  pkg="${spec%%|*}"
  src="${spec#*|}"
  src_lib="$repo_root/$src/lib"
  if [[ ! -f "$src_lib/index.js" ]]; then
    echo "no build output for $pkg at $src_lib" >&2
    exit 1
  fi
  dst_lib="$ai_root/$pkg/lib"
  if [[ ! -d "$dst_lib" ]]; then
    echo "staging host lacks package $pkg" >&2
    exit 1
  fi
  cp -R "$src_lib/." "$dst_lib/"
  echo "  patched $pkg"
done

if [[ ! -f "$build_root/app/lib/main.js" ]]; then
  echo "==> staging Electron app"
  if [[ -x "$(command -v pwsh)" ]]; then
    pwsh -File "$build_root/stage-app.ps1" -AppDir "$build_root/app"
  else
    echo "staged app missing at $build_root/app; run stage-app.ps1 on Windows first" >&2
    exit 1
  fi
fi

if [[ "$target" == "linux" || "$target" == "all" ]]; then
  bash "$build_root/install-linux-natives.sh"
fi

cd "$build_root"
if [[ ! -d node_modules/electron-builder ]]; then
  npm install --no-audit --no-fund
fi
echo "==> building $target"
if [[ "$target" == "win" || "$target" == "all" ]]; then
  npx electron-builder --win nsis
fi
if [[ "$target" == "linux" || "$target" == "all" ]]; then
  npx electron-builder --linux AppImage deb
fi
echo "==> done"
ls -lh "$build_root/dist" | sed -n '1,20p'
