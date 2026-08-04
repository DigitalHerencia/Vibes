# Next Stack Template Agent Instructions

Before editing this template, read:

- `.agents/instructions/agent-architecture-rules.md`
- `.agents/contracts/architecture-boundaries.yml`
- `.agents/docs/architecture-governance.md`

Core rule:

```txt
Pages select.
Layouts and shells frame.
Features orchestrate.
Blocks assemble.
Components render.
Primitives control low-level UI behavior.
Fetchers read.
Actions write.
Auth identifies.
Authz authorizes.
Schemas validate.
DTOs transport safe data.
Transactions persist atomically.
Webhooks reconcile provider events.
```

Clerk organizations are intentionally not used. Authorization is enforced through local Prisma-backed row ownership and membership checks.
