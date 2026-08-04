# Clean-clone tooling implementation plan

> Archived Issue #3 implementation plan. It is not an active work package.

> **Issue:** [#3](https://github.com/DigitalHerencia/Vibes/issues/3)

**Goal:** Make a credential-free clean clone install, generate Prisma artifacts, pass static validation and tests, and produce a Next.js build.

**Architecture:** Keep provider configuration lazy until a database command actually needs it. Restore only the missing presentation primitives and contracts consumed by committed code, remove orphaned Vouch-specific navigation, and use the owner-authorized `/api/clerk/webhooks` route consistently.

**Tech stack:** Next.js 16, TypeScript, pnpm, Prisma 7, Vitest.

### Task 1: Lock the broken surface into contracts

- Extend `tests/contract/architecture-surface.test.ts` to reject unresolved local imports and stale Vouch runtime imports.
- Confirm the existing canonical webhook-route assertion and the new assertions fail.

### Task 2: Normalize clean-clone tooling

- Pin Node and pnpm consistently in root metadata and CI.
- Make Prisma generation and schema validation credential-free; keep migrations credential-gated.
- Define explicit database and validation commands and document Windows/Linux setup.

### Task 3: Restore the committed runtime surface

- Move the Clerk handler to `app/api/clerk/webhooks/route.ts` and update architecture instructions.
- Restore missing UI/block contracts, correct the DTO mapper import, and remove orphaned Vouch navigation.
- Align presentation wrappers with their current block interfaces.

### Task 4: Verify and deliver

- Run focused contracts, Prisma generation/validation without database variables, format, lint, typecheck, unit/contract tests, and production build.
- Review the diff, publish the Issue-linked PR, obtain fresh review evidence, squash-merge, close the Issue, and clean up the branch.
