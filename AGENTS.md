# Vibes Agent Instructions

This repository is an opinionated, reusable B2B SaaS application system. Apply governance in this order:

1. The approved specification and linked GitHub Issue define delivery scope and acceptance.
2. [Accepted ADRs](docs/adr/README.md) govern durable architectural decisions.
3. [Architecture governance](context/docs/architecture-governance.md) defines layer ownership and dependency direction.
4. [Machine-readable contracts](.agents/contracts/README.md) encode current repository boundaries and known gaps.
5. [Agent architecture rules](context/instructions/agent-architecture-rules.md) guide implementation and reporting.
6. [Reference implementations](reference-implementations/README.md) are examples only and never override reusable governance.

When sources conflict, stop before implementation and report the exact conflict. Do not treat plans, archived execution JSON, reference implementations, or old evidence snapshots as current completion evidence.

## Core rule

```txt
Routes adapt.
Features orchestrate.
Components render.
Fetchers read.
Actions write.
Schemas validate.
Authorization decides.
Transactions preserve invariants.
Webhooks reconcile external truth.
```

## Delivery rule

- Inspect the relevant Issue, ADRs, contracts, source, tests, branch, and worktree before editing.
- Preserve unrelated work and make the smallest complete change that satisfies approved scope.
- Distinguish intended architecture, current implementation, known gaps, and executed evidence.
- Never claim an unrun check passed or infer provider/deployment state from source files.
- Stop at production, destructive-data, secret-rotation, external-publication, or policy gates that require owner action.
