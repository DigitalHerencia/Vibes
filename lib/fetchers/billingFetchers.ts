import "server-only"

import { requireTenantContext } from "@/lib/auth/session"
import { withTenantContext } from "@/lib/db/withTenantContext"

export async function hasCoreEntitlement(): Promise<boolean> {
  const context = await requireTenantContext()
  const entitlement = await withTenantContext(context.organization.id, (tx) =>
    tx.billingEntitlement.findUnique({
      where: { organizationId_key: { organizationId: context.organization.id, key: "core" } },
      select: { active: true },
    })
  )
  return entitlement?.active ?? false
}
