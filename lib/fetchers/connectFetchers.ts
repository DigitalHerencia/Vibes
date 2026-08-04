import "server-only"

import { requireTenantContext } from "@/lib/auth/session"
import { assertCapability } from "@/lib/authz/assertions"
import { withTenantContext } from "@/lib/db/withTenantContext"

export async function getConnectReadiness() {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  return withTenantContext(context.organization.id, (tx) =>
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
}
