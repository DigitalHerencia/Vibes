# Credential incident runbook

## Purpose

Use this runbook when provider-local state, an environment file, a token, a key, a credentialed database URL, a dump, or generated credentials may have entered a working tree, Git history, or release archive.

Never reproduce a suspected value in a command, document, Issue, pull request, log, screenshot, test fixture, or chat transcript. Refer to the provider, credential type, file path, and observation time only.

## Repository actions

1. Stop distribution of the affected archive or ref.
2. Remove the generated or secret-bearing file without reading or copying its value.
3. Add the path class to `.gitignore` and `.gitattributes` when the exclusion is reusable.
4. Run the worktree, all-ref history, generated-archive, and synthetic-fixture checks.
5. Record only commands, exit results, safe paths, commit identifiers, and unresolved gates in the evidence ledger.
6. Open a private draft pull request for review. Do not enable the GitHub Template repository setting while any incident or release gate remains open.

## Owner actions outside source control

Credential rotation and upstream-history rewriting are irreversible external actions and require the repository/provider owner.

1. In the affected provider, revoke the exposed credential and issue a replacement with the least privilege required for its environment.
2. Update the deployment platform's encrypted secret store. Do not place the replacement in Git.
3. Redeploy or restart only the consumers that require the replacement, then verify their authenticated provider journeys.
4. Review provider audit logs for use of the old credential from the earliest possible exposure time through revocation.
5. If any distributed or remote Git history contains the value, coordinate a history rewrite with all collaborators and downstream consumers. Invalidate old clones and cached artifacts; force-push only after the owner approves the exact refs and communication plan.
6. Delete affected release archives and caches from distribution systems and regenerate them from a verified sanitized ref.

Repository sanitation reduces continued exposure but does not revoke a credential and does not prove that an unknown upstream archive or clone is clean.

## Reproducible commands

Run from the repository root in PowerShell 7 or later:

```powershell
pwsh -NoProfile -File scripts/Invoke-SecretScan.ps1 -Mode Worktree
pwsh -NoProfile -File scripts/Invoke-SecretScan.ps1 -Mode History
pwsh -NoProfile -File scripts/Test-SecretScanner.ps1
pwsh -NoProfile -File scripts/Test-RepositorySecurity.ps1
```

The scanner reports rule names and paths only. It intentionally suppresses matched values.

## Exit criteria

- The affected credential is revoked or the owner records why rotation is not applicable.
- The current tree and all reachable refs pass the scanner.
- A generated `git archive` passes the scanner.
- The intentional synthetic fixture is rejected.
- Remote caches and archives are replaced or removed where applicable.
- The pull request records skipped provider or upstream-history checks as unresolved owner actions.
