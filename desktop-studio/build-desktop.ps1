# Build: assemble this fork's provider work onto the vendored desktop shell.
#
# Produces a patched desktop installation: the Studio shell (vendored in
# desktop-studio) plus the official host tree plus this fork's
# prebuilt packages. Run from the repository root after `pnpm run build:lib:host`
# (and `build:lib:client` for the client plugin bundles).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File desktop-studio/build-desktop.ps1
#   powershell ... -InstallDir "C:\Users\me\AppData\Local\Programs\@deepseek-aidsh-desktop"
#   powershell ... -SkipShell        # patch an already-installed shell only
#
# Patched packages (our fork's build outputs):
#   dsh-llm, dsh-llm-pi-ai, dsh-host-apiproxy, dsh-tool-cordis,
#   dsh-cordis-client-runner, dsh-client-ui-settings-models, dsh-client-connection
#
# The web shell (dsh-web-frontend/dist) is intentionally NOT patched: the
# vendored Studio shell already matches its own main process, and our UI work
# ships in the client plugin bundles above.

param(
  [string]$InstallDir = "",
  [switch]$SkipShell = $false
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$vendor = Join-Path $repoRoot "desktop-studio"

function Find-InstallDir {
  $paths = @(
    "$env:LOCALAPPDATA\Programs\@deepseek-aidsh-desktop",
    "$env:LOCALAPPDATA\Programs\DeepSeek Harness"
  )
  foreach ($p in $paths) {
    if (Test-Path (Join-Path $p "DeepSeek Harness.exe")) { return $p }
  }
  $reg = Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*","HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -match "DeepSeek Harness" } | Select-Object -First 1
  if ($reg -and $reg.InstallLocation -and (Test-Path (Join-Path $reg.InstallLocation "DeepSeek Harness.exe"))) {
    return $reg.InstallLocation
  }
  throw "desktop install not found; pass -InstallDir"
}

if (-not $InstallDir) { $InstallDir = Find-InstallDir }
$hostRoot = Join-Path $InstallDir "resources\host"
if (-not (Test-Path (Join-Path $hostRoot "node_modules\@deepseek-ai\dsh"))) {
  throw "no host tree under $hostRoot; is this a DeepSeek Harness desktop install?"
}

if (-not $SkipShell) {
  Write-Host "==> verifying vendored shell"
  if (-not (Test-Path (Join-Path $vendor "main-process\lib\main.js"))) {
    throw "vendored main process missing; re-extract from the installer (see desktop-studio/README.md)"
  }
}

$patches = @(
  @{ pkg = "dsh-llm"; src = "packages\llm\llm" },
  @{ pkg = "dsh-llm-pi-ai"; src = "packages\llm\llm-pi-ai" },
  @{ pkg = "dsh-host-apiproxy"; src = "packages\host\apiproxy" },
  @{ pkg = "dsh-tool-cordis"; src = "packages\extensions\tool-cordis" },
  @{ pkg = "dsh-cordis-client-runner"; src = "packages\extensions\cordis-client-runner" },
  @{ pkg = "dsh-client-ui-settings-models"; src = "packages\client\ui-settings-models" },
  @{ pkg = "dsh-client-connection"; src = "packages\client\connection" }
)

Write-Host "==> patching host at $hostRoot"
foreach ($p in $patches) {
  $srcLib = Join-Path $repoRoot (Join-Path $p.src "lib")
  if (-not (Test-Path (Join-Path $srcLib "index.js"))) {
    throw "no build output for $($p.pkg); run pnpm run build:lib:host / build:lib:client first"
  }
  $dstLib = Join-Path $hostRoot "node_modules\@deepseek-ai\$($p.pkg)\lib"
  if (-not (Test-Path $dstLib)) { throw "install has no package $($p.pkg)" }
  Copy-Item -Path (Join-Path $srcLib "*") -Destination $dstLib -Recurse -Force
  Write-Host "  patched $($p.pkg)"
}

Write-Host "==> verifying"
$aiRoot = Join-Path $hostRoot "node_modules\@deepseek-ai"
$pi = Get-Content (Join-Path $aiRoot "dsh-llm-pi-ai\lib\index.js") -Raw
if (-not $pi.Contains("createOAuthFlows")) { throw "dsh-llm-pi-ai build lacks subscription login code" }
$llm = Get-Content (Join-Path $aiRoot "dsh-llm\lib\index.js") -Raw
if (-not $llm.Contains("registerOAuthFlows")) { throw "dsh-llm build lacks OAuth flows" }
$c = Get-Content (Join-Path $aiRoot "dsh-client-ui-settings-models\lib\client.js") -Raw
if (-not $c.Contains("oauthLogin")) { throw "client bundle lacks oauthLogin" }
Write-Host "==> done. Restart 'DeepSeek Harness' to load the patched host."
