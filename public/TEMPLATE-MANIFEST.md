# Template Manifest

Created: 2026-05-19
Initialized as runnable app: 2026-05-20

## Source Guidance

```txt
D:\Vouch\.agents -> D:\.VIBES\templates\next-stack-template\.agents
```

The template keeps `.agents/` as the durable governance source:

- Markdown for human context and architecture rationale.
- YAML for agent-consumable contracts.
- JSON for execution state.

## App Scaffold

The template now includes a runnable Next.js App Router SaaS scaffold:

```txt
app/
components/
content/
features/
lib/
prisma/
schemas/
scripts/
tests/
types/
```

Core configuration:

```txt
package.json
next.config.ts
tsconfig.json
eslint.config.mjs
prettier.config.mjs
postcss.config.mjs
components.json
vitest.config.ts
playwright.config.ts
prisma.config.ts
proxy.ts
```

## Product Decision

The scaffold is generic SaaS branded. It uses the Vouch architecture method but does not copy Vouch product doctrine into user-facing app copy.

## RBAC Decision

Clerk organizations are not used.

Authorization is enforced through local Prisma-backed rows:

```txt
User -> Membership -> Organization -> Project
```

Roles aggregate typed capabilities. Reads and writes must authenticate through Clerk session state, derive Organization context from local membership, and authorize resource/workflow state before returning DTOs or mutating data. Project is not the tenant boundary.

## Mock Pages

Copied examples remain under:

```txt
mock-pages/auth/D1/page.tsx
mock-pages/public/pA/page.tsx
mock-pages/tenant/tC/page.tsx
```

They are examples only. They are not active `app/**` routes.
