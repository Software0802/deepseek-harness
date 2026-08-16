# Stage a complete Electron application directory for the vendored Studio
# main process: compiled JS plus the runtime packages it imports.
#
# The previous assembler copied only lib/ + package.json. electron-builder
# then packed an asar with no node_modules, so the installed app died on
# `import electron-updater` (ERR_MODULE_NOT_FOUND).
#
# Usage (from repo root or this directory):
#   powershell -ExecutionPolicy Bypass -File desktop-build/stage-app.ps1

param(
  [string]$AppDir = "",
  [string]$HostRoot = ""
)

$ErrorActionPreference = "Stop"
$buildRoot = $PSScriptRoot
$repoRoot = Split-Path -Parent $buildRoot
if (-not $AppDir) { $AppDir = Join-Path $buildRoot "app" }
$appFull = [System.IO.Path]::GetFullPath($AppDir)
$repoFull = [System.IO.Path]::GetFullPath($repoRoot)
if ($appFull -eq $repoFull) { throw "refusing to stage the Electron app over the repository root" }

function Resolve-HostRoot {
  $candidates = @()
  if ($HostRoot) { $candidates += $HostRoot }
  $candidates += @(
    (Join-Path $env:LOCALAPPDATA "Programs\DeepSeek Harness\resources\host"),
    (Join-Path $buildRoot "resources\host"),
    (Join-Path $env:TEMP "dsh-staging\host")
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path (Join-Path $c "node_modules\@deepseek-ai\dsh-app-boot\lib\index.js"))) {
      return $c
    }
  }
  return $null
}

$resolvedHost = Resolve-HostRoot
if ($resolvedHost) {
  Write-Host "==> using host tree for Studio-compatible main-process packages: $resolvedHost"
} else {
  Write-Host "==> no staged host tree; falling back to this checkout's packages"
}

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Copy-WorkspacePackage {
  param(
    [string]$Name,
    [string]$SrcRel
  )
  $src = Join-Path $repoRoot $SrcRel
  $manifest = Join-Path $src "package.json"
  $lib = Join-Path $src "lib"
  if (-not (Test-Path $manifest)) { throw "missing package.json for $Name at $src" }
  if (-not (Test-Path (Join-Path $lib "index.js")) -and -not (Test-Path (Join-Path $lib "main.js"))) {
    throw "missing lib output for $Name at $lib; run pnpm run build:lib:host first"
  }
  $dst = Join-Path $AppDir "node_modules\$Name"
  if ($Name.StartsWith("@")) {
    $dst = Join-Path $AppDir "node_modules\$($Name.Replace('/', '\'))"
  }
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
  Copy-Item $manifest $dst -Force
  if (Test-Path $lib) {
    $dstLib = Join-Path $dst "lib"
    if (Test-Path $dstLib) { Remove-Item $dstLib -Recurse -Force }
    Copy-Item $lib $dstLib -Recurse -Force
  }
}

Write-Host "==> staging Electron app at $AppDir"
if (Test-Path $AppDir) { Remove-Item $AppDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $AppDir "lib") -Force | Out-Null

$mainSrc = Join-Path $repoRoot "desktop-studio\main-process"
if (-not (Test-Path (Join-Path $mainSrc "lib\main.js"))) {
  throw "vendored main process missing lib/main.js; see desktop-studio/README.md"
}
robocopy (Join-Path $mainSrc "lib") (Join-Path $AppDir "lib") /E /NFL /NDL /NP /R:1 /W:1 | Out-Null
if (-not (Test-Path (Join-Path $AppDir "lib\main.js"))) { throw "failed to copy main process lib" }

$appManifest = @{
  name        = "@deepseek-ai/dsh-desktop"
  description = "DeepSeek Harness desktop application with tray-owned Host lifecycle"
  version     = "0.1.0-rc.6"
  author      = "Software0802 <software0802@users.noreply.github.com>"
  homepage    = "https://github.com/Software0802/deepseek-harness"
  private     = $true
  type        = "module"
  main        = "lib/main.js"
  license     = "MIT"
  dependencies = [ordered]@{
    "electron-updater"              = "6.8.9"
    "semver"                        = "7.8.5"
    "tar"                           = "7.5.22"
    "js-yaml"               = "4.1.0"
    "@standard-schema/spec" = "1.1.0"
  }
}
Write-Utf8NoBom -Path (Join-Path $AppDir "package.json") -Content ($appManifest | ConvertTo-Json -Depth 6)

Write-Host "==> installing npm runtime packages"
Push-Location $AppDir
try {
  npm install --omit=dev --no-audit --no-fund --install-strategy=nested
} finally {
  Pop-Location
}

Write-Host "==> copying Studio-compatible runtime packages"
# The vendored Studio main process imports Plugin Center / profile APIs
# (readProfileBundleState, PROFILE_TEMPLATES, ...) that exist in the Studio
# host tree's dsh-app-boot, not in the official harness checkout.
$workspacePkgs = @(
  @{ name = "@deepseek-ai/cordis"; src = "vendor\cordis"; host = "cordis" },
  @{ name = "@deepseek-ai/cosmokit"; src = "vendor\cosmokit"; host = "cosmokit" },
  @{ name = "@deepseek-ai/cordis-plugin-group"; src = "vendor\group"; host = "cordis-plugin-group" },
  @{ name = "@deepseek-ai/cordis-plugin-loader"; src = "vendor\loader"; host = "cordis-plugin-loader" },
  @{ name = "@deepseek-ai/cordis-plugin-include"; src = "vendor\include"; host = "cordis-plugin-include" },
  @{ name = "@deepseek-ai/dsh-app-boot"; src = "packages\boot\app-boot"; host = "dsh-app-boot" },
  @{ name = "@deepseek-ai/dsh-atomic-write"; src = "packages\util\atomic-write"; host = "dsh-atomic-write" },
  @{ name = "@deepseek-ai/dsh-home-paths"; src = "packages\util\home-paths"; host = "dsh-home-paths" },
  @{ name = "@deepseek-ai/dsh-launch-environment"; src = "packages\util\launch-environment"; host = "dsh-launch-environment" },
  @{ name = "@deepseek-ai/dsh-invariants"; src = "packages\runtime-diagnostics\invariants"; host = "dsh-invariants" },
  @{ name = "@deepseek-ai/dsh-plugin-center-contracts"; src = "desktop-studio\plugins\dsh-plugin-center-contracts"; host = "dsh-plugin-center-contracts" }
)
foreach ($p in $workspacePkgs) {
  $hostPkg = $null
  if ($resolvedHost) {
    $candidate = Join-Path $resolvedHost "node_modules\@deepseek-ai\$($p.host)"
    if (Test-Path (Join-Path $candidate "lib\index.js")) { $hostPkg = $candidate }
  }
  if ($hostPkg) {
    $dst = Join-Path $AppDir "node_modules\$($p.name.Replace('/', '\'))"
    if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
    Copy-Item (Join-Path $hostPkg "package.json") $dst -Force
    Copy-Item (Join-Path $hostPkg "lib") (Join-Path $dst "lib") -Recurse -Force
    Write-Host "  $($p.name) <- host"
  } else {
    Copy-WorkspacePackage -Name $p.name -SrcRel $p.src
    Write-Host "  $($p.name) <- checkout"
  }
}

# Workspace packages stay as copied directories under node_modules. Do not
# list them as package.json dependencies: electron-builder's walker then
# follows their workspace:^ edges and fails. files: **/* already packs them.

$required = @(
  "electron-updater\package.json",
  "tar\package.json",
  "semver\package.json",
  "@deepseek-ai\dsh-app-boot\lib\index.js",
  "@deepseek-ai\dsh-plugin-center-contracts\lib\index.js",
  "@deepseek-ai\cordis\lib\index.js"
)
foreach ($rel in $required) {
  $path = Join-Path $AppDir "node_modules\$rel"
  if (-not (Test-Path $path)) { throw "staged app missing $rel" }
}
if (-not (Test-Path (Join-Path $AppDir "lib\main.js"))) { throw "staged app missing lib/main.js" }
$boot = Get-Content (Join-Path $AppDir "node_modules\@deepseek-ai\dsh-app-boot\lib\index.js") -Raw
if (-not $boot.Contains("readProfileBundleState")) {
  throw "staged dsh-app-boot lacks Studio profile APIs (readProfileBundleState); copy from a Studio host tree"
}
Write-Host "==> staged Electron app ready"
