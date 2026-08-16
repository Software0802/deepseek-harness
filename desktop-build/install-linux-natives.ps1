# Fetch Linux x64 optional native packages into the assembled host tree.
# Installs into a throwaway npm project so the host's workspace:^ manifest is
# not resolved. node-pty has no published linux-x64 prebuild in 1.1.0; rebuild
# it on Ubuntu (assemble.sh) before shipping.

$ErrorActionPreference = "Stop"
$buildRoot = $PSScriptRoot
$hostRoot = Join-Path $buildRoot "resources\host"
$nm = Join-Path $hostRoot "node_modules"
if (-not (Test-Path (Join-Path $nm "@deepseek-ai\dsh\lib\bin.js"))) {
  throw "assembled host missing at $hostRoot; run assemble.ps1 first (or copy a host tree)"
}

$tmp = Join-Path $env:TEMP ("dsh-linux-natives-" + [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Write-Host "==> installing Linux x64 native optional packages"
  Push-Location $tmp
  npm init -y --silent | Out-Null
  npm install --omit=dev --no-audit --no-fund `
    "@img/sharp-linux-x64@0.35.3" `
    "@koromix/koffi-linux-x64@3.1.5" `
    "node-addon-require-builtin-linux-x64-gnu@0.1.5"
  Pop-Location
  $srcNm = Join-Path $tmp "node_modules"
  foreach ($rel in @(
    "@img\sharp-linux-x64",
    "@img\sharp-libvips-linux-x64",
    "@koromix\koffi-linux-x64",
    "node-addon-require-builtin-linux-x64-gnu"
  )) {
    $from = Join-Path $srcNm $rel
    if (-not (Test-Path $from)) { continue }
    $to = Join-Path $nm $rel
    if (Test-Path $to) { Remove-Item $to -Recurse -Force }
    New-Item -ItemType Directory -Path (Split-Path $to) -Force | Out-Null
    Copy-Item $from $to -Recurse -Force
    Write-Host "  $rel"
  }
} finally {
  if ((Get-Location).Path -eq $tmp) { Pop-Location }
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

$required = @(
  "@img\sharp-linux-x64\package.json",
  "@koromix\koffi-linux-x64\package.json",
  "node-addon-require-builtin-linux-x64-gnu\package.json"
)
foreach ($rel in $required) {
  $path = Join-Path $nm $rel
  if (-not (Test-Path $path)) { throw "linux native missing after install: $rel" }
}
Write-Host "==> linux optional natives ready (rebuild node-pty on Ubuntu)"
