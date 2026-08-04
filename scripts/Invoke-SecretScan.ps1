[CmdletBinding()]
param(
  [ValidateSet('Worktree', 'History', 'Path')]
  [string]$Mode = 'Worktree',
  [string]$RepositoryRoot = (Join-Path $PSScriptRoot '..'),
  [string]$ScanPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryPath = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$maximumTextBytes = 10MB

$signatureRules = @(
  [pscustomobject]@{
    Name = 'private-key'
    Pattern = ('-----BEGIN(?: [A-Z0-9]+)? PRIVATE' + ' KEY-----')
  },
  [pscustomobject]@{
    Name = 'clerk-secret'
    Pattern = ('\b' + ('sk' + '_(?:live|test)_') + '[A-Za-z0-9]{20,}\b')
  },
  [pscustomobject]@{
    Name = 'stripe-restricted-key'
    Pattern = ('\b' + ('rk' + '_(?:live|test)_') + '[A-Za-z0-9]{20,}\b')
  },
  [pscustomobject]@{
    Name = 'stripe-webhook-secret'
    Pattern = ('\b' + ('wh' + 'sec_') + '[A-Za-z0-9]{20,}\b')
  },
  [pscustomobject]@{
    Name = 'github-token'
    Pattern = ('\b(?:' + ('gh' + '[pousr]_') + '|' + ('github' + '_pat_') + ')[A-Za-z0-9_]{20,}\b')
  },
  [pscustomobject]@{
    Name = 'aws-access-key'
    Pattern = ('\b' + ('AK' + 'IA') + '[A-Z0-9]{16}\b')
  }
)

$credentialAssignment = '(?im)^\s*(?:export\s+)?(?:DATABASE_URL|DIRECT_URL|CLERK_SECRET_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|GITHUB_TOKEN|API_KEY|ACCESS_TOKEN|CLIENT_SECRET|PRIVATE_KEY|PASSWORD)\s*[:=]\s*["'']?([^\s#"'']+)'
$credentialedDatabaseUrl = '(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s\/:]+:[^\s@\/]+@(?<host>\[[^\]]+\]|[^:\s\/]+)'
$placeholderPattern = '^(?:\$\{[^}]+\}|<[^>]+>|your[-_].+|example(?:[-_].*)?|replace[-_].*|change[-_]?me|placeholder|(?:postgres(?:ql)?|mysql|mongodb):\/\/[^@]+@(?:localhost|127\.0\.0\.1)(?::\d+)?\/.*)$'

function ConvertTo-PortablePath {
  param([Parameter(Mandatory)][string]$Path)

  return $Path.Replace('\', '/')
}

function Test-ExcludedPath {
  param([Parameter(Mandatory)][string]$RelativePath)

  return $RelativePath -match '^(?:\.git|node_modules|\.next|coverage|dist|out|playwright-report|test-results|prisma/generated)(?:/|$)'
}

function Get-ForbiddenPathRule {
  param([Parameter(Mandatory)][string]$RelativePath)

  $portablePath = ConvertTo-PortablePath -Path $RelativePath
  $leaf = Split-Path -Leaf $portablePath

  if ($portablePath -match '(^|/)\.(?:clerk|vercel|stripe|neon|supabase|wrangler)(/|$)') {
    return 'provider-local-state'
  }

  if ($leaf -match '^\.env(?:\..+)?$' -and $leaf -ne '.env.example') {
    return 'environment-file'
  }

  if ($leaf -match '(?i)^(?:keyless|credentials|service-account)\.json$') {
    return 'generated-credential-file'
  }

  if ($leaf -match '(?i)\.(?:pem|key|p12|pfx|jks|keystore)$') {
    return 'private-key-file'
  }

  if ($leaf -match '(?i)\.(?:db|sqlite|sqlite3|dump|backup)$') {
    return 'database-or-dump-file'
  }

  if ($leaf -match '(?i)\.(?:zip|tar|tgz|tar\.gz|7z|rar)$') {
    return 'generated-archive'
  }

  return $null
}

function Get-ContentFindings {
  param(
    [Parameter(Mandatory)][string]$Content,
    [Parameter(Mandatory)][string]$DisplayPath,
    [switch]$AllowExampleValues
  )

  $findings = [System.Collections.Generic.List[object]]::new()

  foreach ($rule in $signatureRules) {
    if ([regex]::IsMatch($Content, $rule.Pattern)) {
      $findings.Add([pscustomobject]@{ Rule = $rule.Name; Path = $DisplayPath })
    }
  }

  if (-not $AllowExampleValues) {
    foreach ($match in [regex]::Matches($Content, $credentialedDatabaseUrl)) {
      if ($match.Groups['host'].Value -notin @('localhost', '127.0.0.1')) {
        $findings.Add([pscustomobject]@{ Rule = 'credentialed-database-url'; Path = $DisplayPath })
        break
      }
    }

    foreach ($match in [regex]::Matches($Content, $credentialAssignment)) {
      $candidate = $match.Groups[1].Value.Trim()
      if ($candidate -notmatch $placeholderPattern) {
        $findings.Add([pscustomobject]@{ Rule = 'credential-assignment'; Path = $DisplayPath })
        break
      }
    }
  }

  return $findings
}

function Get-FileFindings {
  param(
    [Parameter(Mandatory)][System.IO.FileInfo]$File,
    [Parameter(Mandatory)][string]$BasePath
  )

  $relativePath = ConvertTo-PortablePath -Path ([System.IO.Path]::GetRelativePath($BasePath, $File.FullName))
  if (Test-ExcludedPath -RelativePath $relativePath) {
    return @()
  }

  $findings = [System.Collections.Generic.List[object]]::new()
  $pathRule = Get-ForbiddenPathRule -RelativePath $relativePath
  if ($pathRule) {
    $findings.Add([pscustomobject]@{ Rule = $pathRule; Path = $relativePath })
  }

  if ($File.Length -gt $maximumTextBytes) {
    $findings.Add([pscustomobject]@{ Rule = 'unscanned-large-file'; Path = $relativePath })
    return $findings
  }

  $bytes = [System.IO.File]::ReadAllBytes($File.FullName)
  if ($bytes.Length -gt 0 -and $bytes[0..([Math]::Min($bytes.Length - 1, 8191))] -contains 0) {
    return $findings
  }

  $content = [System.Text.Encoding]::UTF8.GetString($bytes)
  $isExampleFile = $relativePath -match '(^|/)\.env\.example$'
  foreach ($finding in (Get-ContentFindings -Content $content -DisplayPath $relativePath -AllowExampleValues:$isExampleFile)) {
    $findings.Add($finding)
  }

  return $findings
}

function Get-PathFindings {
  param([Parameter(Mandatory)][string]$BasePath)

  $resolvedBase = (Resolve-Path -LiteralPath $BasePath).Path
  $findings = [System.Collections.Generic.List[object]]::new()
  foreach ($file in Get-ChildItem -LiteralPath $resolvedBase -Recurse -Force -File | Sort-Object FullName) {
    foreach ($finding in (Get-FileFindings -File $file -BasePath $resolvedBase)) {
      $findings.Add($finding)
    }
  }

  return $findings
}

function Get-HistoryFindings {
  $findings = [System.Collections.Generic.List[object]]::new()
  $objects = @(& git -C $repositoryPath rev-list --objects --all)
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to enumerate Git history.'
  }

  foreach ($object in $objects | Sort-Object -Unique) {
    if ($object -notmatch '^([0-9a-f]{40,64})\s+(.+)$') {
      continue
    }

    $objectId = $Matches[1]
    $objectPath = ConvertTo-PortablePath -Path $Matches[2]
    $pathRule = Get-ForbiddenPathRule -RelativePath $objectPath
    if ($pathRule) {
      $findings.Add([pscustomobject]@{ Rule = $pathRule; Path = "history:$objectPath@$($objectId.Substring(0, 12))" })
    }

    $objectType = (& git -C $repositoryPath cat-file -t $objectId).Trim()
    if ($LASTEXITCODE -ne 0 -or $objectType -ne 'blob') {
      continue
    }

    $objectSize = [int64]((& git -C $repositoryPath cat-file -s $objectId).Trim())
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to inspect Git object $objectId."
    }

    $displayPath = "history:$objectPath@$($objectId.Substring(0, 12))"
    if ($objectSize -gt $maximumTextBytes) {
      $findings.Add([pscustomobject]@{ Rule = 'unscanned-large-blob'; Path = $displayPath })
      continue
    }

    $content = (& git -C $repositoryPath cat-file -p $objectId | Out-String)
    if ($LASTEXITCODE -ne 0 -or $content.Contains([char]0)) {
      continue
    }

    $isExampleFile = $objectPath -match '(^|/)\.env\.example$'
    foreach ($finding in (Get-ContentFindings -Content $content -DisplayPath $displayPath -AllowExampleValues:$isExampleFile)) {
      $findings.Add($finding)
    }
  }

  return $findings
}

$findings = switch ($Mode) {
  'Worktree' { Get-PathFindings -BasePath $repositoryPath }
  'History' { Get-HistoryFindings }
  'Path' {
    if (-not $ScanPath) {
      throw '-ScanPath is required when -Mode Path is used.'
    }
    Get-PathFindings -BasePath $ScanPath
  }
}

$uniqueFindings = @($findings | Sort-Object Rule, Path -Unique)
if ($uniqueFindings.Count -gt 0) {
  Write-Host "Secret scan failed with $($uniqueFindings.Count) finding(s). Match values are intentionally suppressed."
  foreach ($finding in $uniqueFindings) {
    Write-Host "[$($finding.Rule)] $($finding.Path)"
  }
  exit 1
}

Write-Host "Secret scan passed: $Mode."
exit 0
