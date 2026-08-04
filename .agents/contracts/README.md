# Machine-readable contracts

These YAML files describe current reusable repository boundaries and explicitly recorded gaps. They complement accepted ADRs; they do not prove that an implementation or external integration has been executed.

- `architecture-boundaries.yml`: layer ownership and dependency direction.
- `domain-model.yaml`: current Prisma-backed sample domain and tenant limitations.
- `database-security.yaml`: database roles, tenant context, RLS ownership, and PostgreSQL security-test contract.
- `integrations.yaml`: provider ownership and verified code boundaries.
- `product.yaml`: reusable template identity and sample-domain status.
- `quality-gates.yaml`: executable local validation commands.
- `routes.yaml`: current route families and known catalog exposure.
