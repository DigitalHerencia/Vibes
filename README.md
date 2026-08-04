# Next Stack Template

A runnable App Router SaaS starter shaped by the architecture standards in `.agents/`.

This template is generic SaaS branded. Vouch remains the source inspiration for the method: strict ownership boundaries, route groups, server-owned operations, transport-safe DTOs, local authorization, and deterministic agent guidance.

## Stack

- Next.js App Router with typed routes, React Server Components, Server Actions, ISR/cache revalidation, and React Compiler
- React 19 + TypeScript TSX
- Clerk authentication without organizations
- Prisma 7 + Neon serverless PostgreSQL
- Tailwind CSS v4, `tw-animate-css`, typography plugin, shadcn-compatible neutral primitives
- Zod, Vitest, Playwright, ESLint flat config, Prettier with Tailwind sorting

## Start

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm prisma:generate
pnpm dev
```

Set these values before running protected routes or Prisma-backed actions:

```txt
DATABASE_URL
DIRECT_DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

## Route Map

```txt
app/(public)/
  /              Static marketing composition
  /pricing       Static product/pricing guidance
  /faq           Static architecture FAQ

app/(auth)/
  /sign-in       Clerk sign-in
  /sign-up       Clerk sign-up

app/(tenant)/
  /dashboard              Protected app dashboard
  /projects               Protected project index
  /projects/new           Protected project creation
  /projects/[projectId]   Protected row-authorized detail
  /settings               Clerk account profile

app/api/clerk/webhooks     Provider webhook only
```

## RBAC Model

Clerk identifies the authenticated user. Clerk organizations are intentionally not used.

Authorization is local and row-backed:

- `User` stores the local account mapped to `clerkUserId`.
- `Project` stores owner-owned resources.
- `ProjectMembership` stores row-scoped roles: `owner`, `member`, `viewer`.
- Fetchers filter reads by membership.
- Actions authenticate, authorize, validate, write through transactions, audit, and revalidate.

## Architecture Rule

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

Use the files in `.agents/` as the source of truth for implementation boundaries.

## Validation

```powershell
pnpm prisma:validate
pnpm typegen
pnpm lint
pnpm typecheck
pnpm test
pnpm validate
```

Run Playwright when a dev server can use real Clerk keys:

```powershell
pnpm test:e2e
```

## Mock Pages

`mock-pages/` remains a teaching area copied from the source workbench. These examples are not active App Router routes and should not be treated as production surfaces.
