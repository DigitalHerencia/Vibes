import { capabilitiesForRole } from "@/lib/authz/capabilities"
import type { AuthenticatedUserContext } from "@/types/authTypes"
import type { OrganizationRole, TenantContext } from "@/types/authzTypes"

export type TenantMembershipRecord = {
  id: string
  userId: string
  role: OrganizationRole
  createdAt: Date
  organization: {
    id: string
    status: "active" | "suspended"
  }
}

export function deriveTenantContext(
  context: AuthenticatedUserContext,
  memberships: readonly TenantMembershipRecord[],
  selectedOrganizationId: string | null
): TenantContext | null {
  const available = memberships
    .filter(
      (membership) =>
        membership.userId === context.localUser.id && membership.organization.status === "active"
    )
    .toSorted(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id)
    )

  const membership =
    available.find((candidate) => candidate.organization.id === selectedOrganizationId) ??
    available[0]

  if (!membership) return null

  return {
    ...context,
    organization: membership.organization,
    membership: {
      id: membership.id,
      role: membership.role,
    },
    capabilities: capabilitiesForRole(membership.role),
  }
}
