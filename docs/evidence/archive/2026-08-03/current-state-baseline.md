# Credential incident and current-state evidence baseline

> Archived Issue #1 snapshot captured on 2026-08-03. Its recorded commands remain historical evidence, not current completion state.

**Recorded:** 2026-08-03

**Repository:** `DigitalHerencia/Vibes` (private)

**Sanitized import:** `4f94985`

**Issue:** `#1`

## Incident boundary

The supplied workspace archive contained generated Clerk-local material at `.clerk/.tmp/keyless.json`. The file and its provider-local directory were removed before Git initialization without reading, printing, copying, or committing the value. The sanitized import is the first commit in this repository.

This proves the state of the new `Vibes` repository only. It does not prove that an earlier external archive, cache, clone, provider account, or unknown upstream history is clean. Rotation, provider audit-log review, archive deletion, and any upstream history rewrite remain owner actions described in the incident runbook.

## Reproducible inventory evidence

The current source inventory contains 42 `app/` files, 68 `components/` files, 7 `features/` files, 16 `lib/` files, 1 schema file, 3 shared type files, 1 Prisma schema, 5 tests, 11 `context/` files, and 12 `.agents/` files. Forty App Router route-boundary files were enumerated. See [the classified artifact inventory](artifact-inventory.md) for evidence and inference kept in separate columns.

## Validation ledger

| Command                                                                                  | Result                | Evidence / limitation                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short --branch`                                                            | passed                | Sanitized baseline was clean and tracked `origin/main` before the Issue branch was created.                                                                    |
| `git ls-remote --heads origin main`                                                      | passed                | Remote `main` resolved to sanitized import `4f94985`.                                                                                                          |
| `pwsh -NoProfile -File scripts/Invoke-SecretScan.ps1 -Mode Worktree`                     | passed                | No rejected provider path or credential signature was found; match values are never emitted.                                                                   |
| `pwsh -NoProfile -File scripts/Invoke-SecretScan.ps1 -Mode History`                      | passed                | Every blob reachable from local branches/tags passed at the time recorded.                                                                                     |
| `pwsh -NoProfile -File scripts/Test-SecretScanner.ps1`                                   | passed                | A temporary synthetic Clerk-shaped fixture was rejected and deleted. No live value was used.                                                                   |
| `pwsh -NoProfile -File scripts/Test-RepositorySecurity.ps1 -ArchiveRef <staged-tree-id>` | passed                | Worktree, all-ref history, generated archive, and temporary synthetic-fixture gates passed against the staged candidate tree.                                  |
| `pnpm --version`                                                                         | could not run         | The provisioned pnpm launcher points to a missing local executable; package validation was not claimed.                                                        |
| Codex Security scan                                                                      | intentionally not run | Repository owner directed this task to skip that external scanner. Repository-native deterministic checks remain in scope.                                     |
| GitHub native secret scanning and push protection enablement                             | could not run         | GitHub's repository API returned HTTP 422: secret scanning is not available for this private repository. The read-only Actions gate remains enabled in source. |
| Provider credential rotation and audit-log review                                        | owner action; not run | Requires provider-console authority and may be irreversible.                                                                                                   |
| Unknown upstream history/archive scan                                                    | unavailable           | No upstream Git history was supplied or imported; external copies are outside this repository's evidence boundary.                                             |

## Current release disposition

The repository remains unsuitable for GitHub Template activation until the remaining review-pack launch gates are completed. Issue #1 changes credential containment and evidence only; it does not change or certify product behavior, architecture, tenancy, RLS, webhooks, billing, deployment, or release readiness.
