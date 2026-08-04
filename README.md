# Next Stack Template

A runnable App Router SaaS starter shaped by accepted ADRs, human-readable architecture governance, and machine-readable contracts.

Product-specific examples are preserved under `reference-implementations/` and are non-authoritative.

## Stack

- Next.js App Router with typed routes, React Server Components, Server Actions, ISR/cache revalidation, and React Compiler
- React 19 + TypeScript TSX
- Clerk authentication without organizations
- Prisma 7 + Neon serverless PostgreSQL
- Tailwind CSS v4, `tw-animate-css`, typography plugin, shadcn-compatible neutral primitives
- Zod, Vitest, Playwright, ESLint flat config, Prettier with Tailwind sorting

## Start

Node.js 24 and pnpm 11.1.1 are the repository toolchain. Vercel reads the Node major from `package.json`; local version managers and CI read the exact release from `.node-version`.

### Windows (PowerShell)

```powershell
corepack enable
corepack install
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm db:generate
pnpm dev
```

### Linux and macOS

```sh
corepack enable
corepack install
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:generate
pnpm dev
```

Installation, Prisma client generation, schema validation, static checks, unit tests, contract tests, and the production build do not require live provider credentials. Set these values before protected routes, database operations, or provider-backed actions:

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

The repository also currently compiles presentation/reference routes from `app/(presentation)` and the `D1`, `pA`-`pC`, and `tA`-`tC` examples. They are accurately recorded as a known isolation gap in `.agents/contracts/routes.yaml`; ADR-0009 defines the intended boundary without claiming it is already implemented.

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

Start with `AGENTS.md` for source precedence. Accepted decisions live in `docs/adr/`, reusable governance in `context/`, machine-readable current-state contracts in `.agents/contracts/`, and non-universal examples in `reference-implementations/`.

## Validation

```powershell
pnpm db:generate
pnpm db:validate
pnpm validate:fast
pnpm validate
pnpm validate:ci
```

`pnpm validate:ci` is the credential-free clean-clone gate. Run the release gate only when a test environment has real provider credentials:

```powershell
pnpm validate:release
```

Database mutation commands remain explicit: `pnpm db:migrate` creates development migrations, `pnpm db:deploy` applies committed migrations, and `pnpm db:seed` runs the configured seed. Never run them against production without an approved deployment gate.

## Mock Pages

`mock-pages/` remains a teaching area copied from the source workbench. These examples are not active App Router routes and should not be treated as production surfaces.
