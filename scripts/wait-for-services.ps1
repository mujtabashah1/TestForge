param([int]$TimeoutSeconds = 120)
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
foreach ($url in @('http://localhost:4000/health','http://localhost:3000')) {
  while ((Get-Date) -lt $deadline) {
    try { if ((Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3).StatusCode -eq 200) { break } } catch {}
    Start-Sleep -Seconds 2
  }
  if ((Get-Date) -ge $deadline) { throw "Timed out waiting for $url" }
  Write-Host "Ready: $url"
}
