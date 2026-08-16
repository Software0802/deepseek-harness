# Assemble the desktop build inputs and produce the installer.
#
#   powershell -ExecutionPolicy Bypass -File assemble.ps1
#
# Inputs:
#   - desktop-studio/main-process   vendored Studio main process
#   - $env:DSH_STAGING_HOST         staged host tree (default: %TEMP%\dsh-staging\host)
#   - this fork's prebuilt lib/     from packages/* (run pnpm build:lib:host /
#                                   build:lib:client first)
#
# Outputs:
#   - app/     Electron app (main process + runtime node_modules)
#   - resources/host    packaged host tree (with this fork's patches applied)
#   - resources/desktop-resources  tray icons
#   - dist/DeepSeek-Harness-<version>-x64-Setup.exe
#
# First run installs electron + electron-builder locally (network required).

param(
  [string]$StagingHost = "$env:TEMP\dsh-staging\host",
  [ValidateSet("win", "linux", "all")]
  [string]$Target = "win"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path (Join-Path $StagingHost "node_modules\@deepseek-ai\dsh\lib\bin.js"))) {
  $fallback = Join-Path $PSScriptRoot "resources\host"
  if (Test-Path (Join-Path $fallback "node_modules\@deepseek-ai\dsh\lib\bin.js")) {
    $StagingHost = $fallback
    Write-Host "==> using existing assembled host at $StagingHost"
  } else {
    throw "staging host not found at $StagingHost; copy one from an installed desktop or the npx cache first"
  }
}

Write-Host "==> staging Electron app (main process + runtime deps)"
& (Join-Path $PSScriptRoot "stage-app.ps1") -AppDir (Join-Path $PSScriptRoot "app")
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "stage-app.ps1 failed" }

Write-Host "==> assembling resources (host + tray icons)"
$resDst = Join-Path $PSScriptRoot "resources"
$hostDst = Join-Path $resDst "host"
$stagingResolved = [System.IO.Path]::GetFullPath($StagingHost)
$hostDstResolved = [System.IO.Path]::GetFullPath($hostDst)
if ($stagingResolved -ne $hostDstResolved) {
  if (Test-Path $hostDst) { Remove-Item $hostDst -Recurse -Force }
  New-Item -ItemType Directory -Path $hostDst -Force | Out-Null
  robocopy $StagingHost $hostDst /E /MT:16 /NFL /NDL /NP /R:1 /W:1 | Out-Null
}
$traySrc = Join-Path (Split-Path -Parent $StagingHost) "desktop-resources"
$trayDst = Join-Path $resDst "desktop-resources"
if (Test-Path $traySrc) {
  if ($traySrc -ne $trayDst) {
    if (Test-Path $trayDst) { Remove-Item $trayDst -Recurse -Force }
    Copy-Item $traySrc $trayDst -Recurse -Force
  }
} else {
  Write-Host "  (no tray icons found; proceeding without them)"
}

Write-Host "==> applying this fork's patches onto the packaged host"
$aiRoot = Join-Path $resDst "host\node_modules\@deepseek-ai"
$patches = @(
  @{ pkg = "dsh-session"; src = "packages\core\session" },
  @{ pkg = "dsh-llm"; src = "packages\llm\llm" },
  @{ pkg = "dsh-llm-pi-ai"; src = "packages\llm\llm-pi-ai" },
  @{ pkg = "dsh-host-apiproxy"; src = "packages\host\apiproxy" },
  @{ pkg = "dsh-tool-cordis"; src = "packages\extensions\tool-cordis" },
  @{ pkg = "dsh-cordis-client-runner"; src = "packages\extensions\cordis-client-runner" },
  @{ pkg = "dsh-client-ui-settings-models"; src = "packages\client\ui-settings-models" },
  @{ pkg = "dsh-client-connection"; src = "packages\client\connection" },
  @{ pkg = "dsh-client-ui-desktop-customization"; src = "desktop-studio\plugins\dsh-client-ui-desktop-customization" }
)
foreach ($p in $patches) {
  $srcLib = Join-Path $root (Join-Path $p.src "lib")
  if (-not (Test-Path (Join-Path $srcLib "index.js"))) {
    throw "no build output for $($p.pkg); run pnpm build:lib:host / build:lib:client first"
  }
  $dstLib = Join-Path $aiRoot "$($p.pkg)\lib"
  if (-not (Test-Path $dstLib)) { throw "staging host lacks package $($p.pkg)" }
  Copy-Item -Path (Join-Path $srcLib "*") -Destination $dstLib -Recurse -Force
  Write-Host "  patched $($p.pkg)"
}

Write-Host "==> verifying assembled inputs"
$pi = Get-Content (Join-Path $aiRoot "dsh-llm-pi-ai\lib\index.js") -Raw
if (-not $pi.Contains("createOAuthFlows")) { throw "dsh-llm-pi-ai patch missing" }
$c = Get-Content (Join-Path $aiRoot "dsh-client-ui-settings-models\lib\client.js") -Raw
if (-not $c.Contains("oauthLogin")) { throw "client bundle patch missing" }

Write-Host "==> installing build tools (first run downloads electron)"
Push-Location $PSScriptRoot
try {
  if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules\electron-builder"))) {
    npm install --no-audit --no-fund
  }

  Write-Host "==> building installer ($Target)"
  if ($Target -eq "win" -or $Target -eq "all") {
    npx --no-install electron-builder --win nsis
    if ($LASTEXITCODE -ne 0) { throw "electron-builder --win failed ($LASTEXITCODE)" }
  }
  if ($Target -eq "linux" -or $Target -eq "all") {
    & (Join-Path $PSScriptRoot "install-linux-natives.ps1")
    npx --no-install electron-builder --linux AppImage deb
    if ($LASTEXITCODE -ne 0) { throw "electron-builder --linux failed ($LASTEXITCODE)" }
  }
} finally {
  Pop-Location
}
Write-Host "==> done. Artifacts:"
Get-ChildItem (Join-Path $PSScriptRoot "dist") -File | Select-Object Name, @{n="SizeMB";e={[math]::Round($_.Length/1MB,1)}}
