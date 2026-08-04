# Full-stack architecture governance

This is the canonical human-readable ownership model for the reusable repository. It describes current source separately from accepted target decisions and known gaps.

## Authority and evidence

- `AGENTS.md` defines source precedence and delivery rules.
- `docs/adr/` contains accepted durable decisions; an ADR is not proof of implementation.
- `.agents/contracts/` describes current machine-readable boundaries and known gaps.
- `context/instructions/agent-architecture-rules.md` guides implementation behavior.
- `reference-implementations/` contains non-authoritative product examples.
- `docs/evidence/archive/` contains historical snapshots, never current completion state.

Current implementation claims require source inspection and fresh executed validation. Provider, preview, deployment, migration, and production claims require live evidence from the owning system.

## Architectural source of truth

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

Every file has one primary architectural role. Dependency direction follows authority: presentation may depend on transport contracts, but it cannot depend on persistence or provider truth.

## Current repository map

### Route adapters

`app/` owns route files, metadata, layouts, route parameters, redirects, Suspense, and HTTP requests/responses.

Current route families:

- `app/(public)/`: public product surfaces.
- `app/(auth)/`: Clerk authentication surfaces.
- `app/(tenant)/`: currently protected application surfaces.
- `app/(presentation)/`: currently exposed presentation examples; ADR-0009 records the required isolation and `.agents/contracts/routes.yaml` records the gap.
- `app/api/clerk/webhooks/route.ts`: canonical Clerk event ingress.

Routes do not access Prisma, SQL, or provider SDK business operations directly.

### Feature orchestration

`features/` owns route-specific orchestration, protected fetcher calls, action binding, DTO state branching, and feature-level Suspense/client boundaries. It is not an alternate persistence or provider layer.

### Presentation

- `components/ui/` owns accessible primitives with no product knowledge.
- `components/blocks/` assembles reusable page sections from typed props.
- `components/navigation/` and `components/shells/` own route chrome and responsive frames.
- `components/projects/` is sample-domain presentation and accepts transport/display contracts.
- `components/(presentation)/` contains reference presentation orchestration and fixtures; it is a known cleanup target, not a canonical server-operation layer.

Presentation performs no protected reads, writes, authorization, Prisma/SQL access, or provider SDK operations.

### Server operations

- `lib/fetchers/` owns authenticated, authorized, read-only protected reads.
- `lib/actions/` owns thin public Server Action adapters.
- `lib/auth/` adapts Clerk identity/session into local identity.
- `lib/authz/` owns capability, resource, and workflow policies.
- `lib/db/selects/` owns explicit Prisma projections.
- `lib/db/dto/` maps persistence records to transport-safe contracts.
- `lib/db/transactions/` owns minimal atomic persistence mechanics.
- `lib/db/prisma.ts` owns lazy server-only Prisma initialization.
- `lib/cache/` owns cache tags and invalidation helpers.

`lib/integrations/` maps verified provider values into bounded domain-safe inputs. `lib/webhooks/` coordinates provider-independent claim/retry semantics with provider-specific reconciliation. Domain workflow directories orchestrate approved application use cases.

### Trust boundaries

- `schemas/` validates untrusted runtime input with Zod.
- `types/` contains stable transport and shared contracts.
- `prisma/` owns the schema, migrations, seed, and generated-client configuration.
- `.github/workflows/` owns repository CI definitions.

Unrestricted Prisma records and raw provider payloads do not escape approved server data layers.

## Server operation contracts

### Protected read

```txt
authenticate
-> authorize
-> minimal select
-> map to DTO
-> apply cache policy
-> return transport-safe data
```

Fetchers are read-only and do not hide synchronization writes.

### UI mutation

```txt
Server Action
-> authenticate
-> authorize
-> validate
-> workflow or transaction
-> audit/recovery
-> invalidate or redirect
-> typed result
```

Transaction helpers receive validated typed input and a transaction client. They do not redirect or own UI behavior.

### Provider webhook

```txt
read raw body
-> verify signature
-> runtime-validate normalized values
-> atomically claim durable event
-> process idempotently
-> record terminal or retryable state
-> return provider-compatible response
```

An existing event row is not proof of completed processing. Store bounded sanitized failure metadata, not secrets or unrestricted payloads.

## Security invariants

- Clerk proves identity; local state owns application authorization.
- Authenticate and authorize every protected operation on the server.
- Never trust client-supplied user, tenant, membership, role, capability, provider identifier, price, account, or return URL authority.
- Validate every untrusted boundary with Zod or an equivalent runtime schema.
- Use minimal selects and DTOs to constrain exposure.
- Keep credentials and provider SDK semantics in server-owned integration boundaries.
- Preserve atomic invariants with transactions and repeated-provider safety with idempotency.
- Organization tenancy, capability RBAC, PostgreSQL RLS, shared webhook claims, Stripe subscription billing, and the optional Stripe Connect code reference are implemented with executable local proof; treat live-environment role provisioning, live Clerk/Stripe configuration and authenticated journeys, Connect liability/provider configuration, and catalog isolation as incomplete until their owning gates provide fresh evidence.
- Server-operation ownership is mechanically enforced by `scripts/validate-architecture.mjs` and `.agents/contracts/server-operations.yaml`: routes and components cannot reach persistence/provider infrastructure, fetchers cannot mutate, Server Actions live in `lib/actions`, transactions cannot own UI/provider behavior, and public types cannot import Prisma.

## Presentation contract

```txt
tokens -> primitives -> shared/domain components -> blocks -> feature orchestration -> routes
```

Default to Server Components. Introduce client boundaries only for browser interaction. Reusable presentation receives typed props/slots, includes accessible responsive behavior, and performs no protected data or provider access.

## Validation ownership

- `pnpm validate:fast`: credential-free formatting, linting, route generation, and type checking.
- `pnpm governance:validate`: contract parsing and governance structure tests.
- `pnpm architecture:validate`: executable dependency-boundary validation and contract tests.
- `pnpm validate`: credential-free generation, schema validation, static checks, and unit/contract tests.
- `pnpm validate:ci`: the complete credential-free gate including a production build.
- `pnpm validate:release`: credentialed security and browser validation; it is not a default local claim.

Never report an unrun command as passed. Production migrations, deployments, provider configuration, and destructive data changes require explicit owner approval.
