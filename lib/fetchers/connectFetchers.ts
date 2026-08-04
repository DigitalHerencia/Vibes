import "server-only"

import { requireTenantContext } from "@/lib/auth/session"
import { assertCapability } from "@/lib/authz/assertions"
import { withTenantContext } from "@/lib/db/withTenantContext"
import type { ConnectReadinessDTO } from "@/types/connectTypes"

export async function getConnectReadiness(): Promise<ConnectReadinessDTO> {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  const readiness = await withTenantContext(context.organization.id, (tx) =>
    tx.connectAccount.findUnique({
      where: { organizationId: context.organization.id },
      select: {
        status: true,
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        requirementsDueCount: true,
        disabledReason: true,
        providerUpdatedAt: true,
      },
    })
  )
  return readiness
    ? { ...readiness, providerUpdatedAt: readiness.providerUpdatedAt.toISOString() }
    : null
}
