# Re-converts every reference replay and compares the result with golden\*.checks.json.
# Usage (from the project folder):  powershell -ExecutionPolicy Bypass -File tools\verify-golden.ps1 [-Replays <folder with the replay zips>]
param([string]$Replays = (Join-Path $PSScriptRoot "..\.."))
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$exe = Join-Path $root "bin\wtdecode.exe"
$tmp = Join-Path $env:TEMP ("wtgolden-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
$failed = 0
Get-ChildItem (Join-Path $root "golden") -Filter *.checks.json | ForEach-Object {
  $session = $_.BaseName -replace '\.checks$', ''
  $zip = Join-Path $Replays "$session.zip"
  # zips are often saved without the session ID's leading zeros (be95b... for 0be95b...)
  if (-not (Test-Path $zip)) { $zip = Join-Path $Replays (($session -replace '^0+', '') + ".zip") }
  if (-not (Test-Path $zip)) { Write-Host "SKIP  $session (no $zip)"; return }
  $report = Join-Path $tmp "$session.json"
  & $exe -in $zip -wtr (Join-Path $tmp "$session.wtr") -check-report $report | Out-Null
  if (-not (Test-Path $report)) { Write-Host "FAIL  $session (decoder produced no report)"; $failed++; return }
  $want = Get-Content $_.FullName -Raw | ConvertFrom-Json
  $got = Get-Content $report -Raw | ConvertFrom-Json
  $diff = @()
  foreach ($p in $want.counts.PSObject.Properties) { if ($got.counts.($p.Name) -ne $p.Value) { $diff += "count $($p.Name): $($got.counts.($p.Name)) (expected $($p.Value))" } }
  foreach ($c in $want.checks) {
    $g = $got.checks | Where-Object { $_.id -eq $c.id }
    if (-not $g) { $diff += "check $($c.id) missing" }
    elseif ($g.status -ne $c.status -or $g.value -ne $c.value) { $diff += "check $($c.id): $($g.status) '$($g.value)' (expected $($c.status) '$($c.value)')" }
  }
  if ($diff.Count -eq 0) { Write-Host "OK    $session" } else { Write-Host "FAIL  $session"; $diff | ForEach-Object { Write-Host "        $_" }; $failed++ }
}
Remove-Item $tmp -Recurse -Force
if ($failed -gt 0) { Write-Host "$failed reference match(es) differ."; exit 1 } else { Write-Host "All reference matches decode as expected." }
