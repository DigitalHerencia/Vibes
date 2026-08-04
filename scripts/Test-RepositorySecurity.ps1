[CmdletBinding()]
param(
  [string]$RepositoryRoot = (Join-Path $PSScriptRoot '..'),
  [string]$ArchiveRef = 'HEAD'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryPath = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$scanner = Join-Path $PSScriptRoot 'Invoke-SecretScan.ps1'
$fixtureTest = Join-Path $PSScriptRoot 'Test-SecretScanner.ps1'
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('vibes-security-' + [guid]::NewGuid().ToString('N'))
$archivePath = Join-Path $temporaryRoot 'repository.zip'
$expandedPath = Join-Path $temporaryRoot 'archive'

function Invoke-CheckedPowerShell {
  param(
    [Parameter(Mandatory)][string]$Label,
    [Parameter(Mandatory)][string[]]$Arguments
  )

  Write-Host "Running: $Label"
  & pwsh -NoProfile @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed."
  }
}

try {
  Invoke-CheckedPowerShell -Label 'worktree secret scan' -Arguments @('-File', $scanner, '-Mode', 'Worktree', '-RepositoryRoot', $repositoryPath)
  Invoke-CheckedPowerShell -Label 'all-ref Git history secret scan' -Arguments @('-File', $scanner, '-Mode', 'History', '-RepositoryRoot', $repositoryPath)

  [System.IO.Directory]::CreateDirectory($temporaryRoot) | Out-Null
  [System.IO.Directory]::CreateDirectory($expandedPath) | Out-Null
  & git -C $repositoryPath archive --format=zip --output=$archivePath $ArchiveRef
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to create the release archive from $ArchiveRef."
  }

  Expand-Archive -LiteralPath $archivePath -DestinationPath $expandedPath
  Invoke-CheckedPowerShell -Label 'generated release archive secret scan' -Arguments @('-File', $scanner, '-Mode', 'Path', '-RepositoryRoot', $repositoryPath, '-ScanPath', $expandedPath)
  Invoke-CheckedPowerShell -Label 'intentional secret fixture rejection' -Arguments @('-File', $fixtureTest, '-RepositoryRoot', $repositoryPath)

  Write-Host 'Repository security verification passed.'
}
finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
  }
}
