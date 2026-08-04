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
CLERK_WEBHOOK_SIGNING_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_RECURRING_PRICE_ID
STRIPE_CONNECT_WEBHOOK_SECRET
STRIPE_CONNECT_COUNTRY
STRIPE_CONNECT_CURRENCY
STRIPE_CONNECT_PLATFORM_FEE_BPS
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
app/api/stripe/webhooks    Provider webhook only
app/api/stripe/connect/webhooks  Optional Connect webhook only
```

The typed presentation catalog lives at `/catalog` in development. The `app/(presentation)` reference routes are no-index and fail closed in production unless `PRESENTATION_CATALOG_ENABLED=true`; normal product deployments should leave it disabled. Vouch-specific catalog copy and fixtures live under `reference-implementations/vouch` and remain explicitly non-universal.

## RBAC Model

Clerk identifies the authenticated user. Clerk organizations are intentionally not used.

Authorization is local and row-backed:

- `User` stores the local account mapped to `clerkUserId`.
- `Organization` is the tenant and billing boundary.
- `Membership` joins users to organizations with `owner`, `admin`, `member`, or `viewer` roles; roles aggregate stable capabilities in `lib/authz`.
- `OrganizationInvitation` stores bounded, expiring invitations without delegating authority to Clerk metadata.
- `Project` remains a removable tenant-owned sample resource, never the tenant itself.
- Fetchers and workflows derive tenant context from local membership, enforce resource/workflow policies, write through transactions, audit, and revalidate.

The committed Prisma baseline creates a non-login `vibes_runtime` privilege role, explicit grants, and forced tenant RLS policies. Runtime code sets `app.current_organization_id` transaction-locally through `lib/db/withTenantContext.ts`; missing context fails closed. `pnpm test:database-security` replays the migration in ephemeral PostgreSQL and executes direct containment attacks. Live runtime-login provisioning and production migration remain owner-controlled deployment gates.

Clerk user synchronization enters only through the public `/api/clerk/webhooks` route. The route uses Clerk's verifier, runtime-validates provider values, and delegates to an atomic shared ledger with `received`, `processing`, `processed`, `ignored`, and `failed` states. Failed claims retry immediately; processing claims become retryable after five minutes. Session helpers are read-only, and local memberships/capabilities—not Clerk metadata—remain authorization truth.

Stripe subscription billing provides one server-configured recurring plan through hosted Checkout and Customer Portal sessions. Only local owners with `billing.manage` can create those sessions; tenant, customer, price, and return URLs are server-derived. The verified `/api/stripe/webhooks` route retrieves current Stripe state, normalizes it into tenant-owned subscription/item records, and updates the local `core` entitlement atomically. Browser return pages never grant access. Drift inspection is read-only and never auto-repairs provider or local state.

The optional Stripe Connect reference module is separate from subscription billing. It uses Stripe-hosted onboarding and Checkout with manual-capture destination charges, server-owned amount/currency/fee/account scope, retrieve-before-settlement, full-refund transfer and application-fee reversal, and normalized tenant mirrors. The platform bears Stripe fees, refunds, and disputes for this model. See `docs/stripe-connect-reference.md`; `pnpm test:connect-removal` proves the core production build after physically removing the optional runtime files.

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
pnpm test:database-security
```

Authenticated Playwright suites can import `authenticatedTest` from `tests/e2e/fixtures/authenticated.ts` and select `owner`, `admin`, `member`, `viewer`, or `disabled`. These provider-backed fixtures require the matching `E2E_CLERK_*_EMAIL` variables plus Clerk development credentials; they are not part of credential-free PR validation.

`pnpm validate:ci` is the credential-free clean-clone gate. Run the release gate only when a test environment has real provider credentials:

```powershell
pnpm validate:release
```

Database mutation commands remain explicit: `pnpm db:migrate` creates development migrations, `pnpm db:deploy` applies committed migrations, and `pnpm db:seed` runs the configured seed. Never run them against production without an approved deployment gate.

Use a pooled restricted-role URL for `DATABASE_URL` and a direct migration-owner URL for `DIRECT_DATABASE_URL`. The runtime login must inherit `vibes_runtime`; it must not own protected tables or receive `BYPASSRLS`.

## Pull-request CI

Pull requests run the same credential-free `pnpm validate:ci` contract after a frozen install. Repository secret scanning remains a separate read-only workflow so failures stay attributable.

Coverage thresholds, visual suites, full Playwright matrices, deployment, and production migrations are intentionally not pull-request gates yet. Real-database containment remains an explicit focused gate under `pnpm test:database-security`; the other expensive/provider-specific work stays under `pnpm validate:release` or an owner-authorized deployment plan.

## Mock Pages

`mock-pages/` remains a teaching area copied from the source workbench. These examples are not active App Router routes and should not be treated as production surfaces.
