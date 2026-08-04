[CmdletBinding()]
param(
  [string]$RepositoryRoot = (Join-Path $PSScriptRoot '..')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scanner = Join-Path $PSScriptRoot 'Invoke-SecretScan.ps1'
$fixtureRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('vibes-secret-fixture-' + [guid]::NewGuid().ToString('N'))

try {
  [System.IO.Directory]::CreateDirectory($fixtureRoot) | Out-Null
  $fixturePath = Join-Path $fixtureRoot 'intentional-fixture.txt'
  $syntheticValue = ('sk' + '_test_' + ('A' * 32))
  [System.IO.File]::WriteAllText($fixturePath, "CLERK_SECRET_KEY=$syntheticValue")

  & pwsh -NoProfile -File $scanner -Mode Path -RepositoryRoot $RepositoryRoot -ScanPath $fixtureRoot *> $null
  if ($LASTEXITCODE -eq 0) {
    throw 'The intentional synthetic secret fixture was not rejected.'
  }

  Write-Host 'Intentional synthetic secret fixture was rejected as expected.'
}
finally {
  if (Test-Path -LiteralPath $fixtureRoot) {
    Remove-Item -LiteralPath $fixtureRoot -Recurse -Force
  }
}
