import "server-only"

import { requireCurrentUserContext, requireTenantContext } from "@/lib/auth/session"
import { assertCanManageMembership } from "@/lib/authz/assertions"
import { canCreateInvitation } from "@/lib/authz/policies"
import { withTenantContext } from "@/lib/db/withTenantContext"
import {
  changeMembershipTx,
  createOrganizationInvitationTx,
  createOrganizationTx,
} from "@/lib/db/transactions/organizationTransactions"
import {
  createOrganizationSchema,
  inviteOrganizationMemberSchema,
  updateMembershipSchema,
} from "@/schemas/organizationSchemas"

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000

export async function createOrganizationWorkflow(input: unknown) {
  const parsed = createOrganizationSchema.parse(input)
  const context = await requireCurrentUserContext()
  const organizationId = crypto.randomUUID()

  return withTenantContext(organizationId, (tx) =>
    createOrganizationTx(tx, {
      ...parsed,
      organizationId,
      actorUserId: context.localUser.id,
    })
  )
}

export async function inviteOrganizationMemberWorkflow(input: unknown) {
  const parsed = inviteOrganizationMemberSchema.parse(input)
  const context = await requireTenantContext()
  if (!canCreateInvitation(context, parsed.role)) throw new Error("Invitation denied.")

  return withTenantContext(context.organization.id, (tx) =>
    createOrganizationInvitationTx(tx, {
      ...parsed,
      organizationId: context.organization.id,
      actorUserId: context.localUser.id,
      expiresAt: new Date(Date.now() + invitationLifetimeMs),
    })
  )
}

export async function updateMembershipWorkflow(input: unknown) {
  const parsed = updateMembershipSchema.parse(input)
  const context = await requireTenantContext()
  return withTenantContext(
    context.organization.id,
    (tx) =>
      changeMembershipTx(
        tx,
        {
          ...parsed,
          organizationId: context.organization.id,
          actorUserId: context.localUser.id,
        },
        ({ target, ownerCount }) =>
          assertCanManageMembership(context, target, ownerCount, parsed.role)
      ),
    { isolationLevel: "Serializable" }
  )
}
