# Security policy

## Reporting

Report suspected credential exposure or security vulnerabilities privately to the repository owner. Do not place credential values, raw provider payloads, environment files, or exploit details containing private data in an Issue, pull request, commit, screenshot, log, or chat transcript.

## Repository credential policy

- Provider-local state and generated credential files are not source artifacts.
- Only `.env.example` may be committed; it must contain non-live example values.
- Private keys, credentialed non-local database URLs, dumps, local databases, and generated release archives are rejected by the repository scanner.
- GitHub Actions receives read-only repository contents permission and does not persist checkout credentials.
- Provider credentials belong in the provider or deployment platform's secret store, scoped to the narrowest required environment and capability.

Run the complete repository security gate from PowerShell:

```powershell
pwsh -NoProfile -File scripts/Test-RepositorySecurity.ps1
```

See [the credential incident runbook](docs/runbooks/credential-incident.md) for containment, rotation, and history-cleanup responsibilities.
