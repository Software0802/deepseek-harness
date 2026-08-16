# Reinstall the official Studio desktop shell, then patch this fork's
# model-routing packages into its host tree.
#
# Requires 7-Zip (`7z`) on PATH. Downloads the rc.6 installer once if needed.
#
#   powershell -ExecutionPolicy Bypass -File desktop-studio/reinstall-desktop.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$buildRoot = Join-Path $repoRoot "desktop-build"
$setup = Join-Path $buildRoot "official-rc6-setup.exe"
$extract = Join-Path $buildRoot "official-rc6-extracted"
$installDir = Join-Path $env:LOCALAPPDATA "Programs\@deepseek-aidsh-desktop"
$expectedHash = "50df632c629ff4fdbfff0a752870795cd577e69d1e909b277059ca7118d0e6b0"
$url = "https://github.com/fufankeji/deepseek-harness-studio/releases/download/desktop-preview-v0.1.0-rc.6/DeepSeek-Harness-Desktop-Windows-x64-0.1.0-rc.6-Setup.exe"

Get-Process | Where-Object { $_.Name -like "*DeepSeek*" } | Stop-Process -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $setup)) {
  New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
  Write-Host "==> downloading official Studio rc.6"
  curl.exe -L --retry 3 --retry-delay 2 -o $setup $url
}
$hash = (Get-FileHash $setup -Algorithm SHA256).Hash.ToLower()
if ($hash -ne $expectedHash) { throw "installer hash $hash does not match $expectedHash" }

if (-not (Test-Path (Join-Path $extract "`$PLUGINSDIR\app-64.7z"))) {
  if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
  Write-Host "==> extracting NSIS payload"
  & 7z.exe x $setup "-o$extract" -y | Out-Null
}

$app7z = Join-Path $extract "`$PLUGINSDIR\app-64.7z"
if (-not (Test-Path $app7z)) { throw "NSIS payload missing app-64.7z" }

Write-Host "==> installing to $installDir"
if (Test-Path $installDir) { Remove-Item $installDir -Recurse -Force }
New-Item -ItemType Directory -Path $installDir | Out-Null
& 7z.exe x $app7z "-o$installDir" -y | Out-Null
if (-not (Test-Path (Join-Path $installDir "DeepSeek Harness.exe"))) {
  throw "extract did not produce DeepSeek Harness.exe"
}

& (Join-Path $PSScriptRoot "build-desktop.ps1") -InstallDir $installDir -SkipShell
Write-Host "==> launch: $installDir\DeepSeek Harness.exe"
