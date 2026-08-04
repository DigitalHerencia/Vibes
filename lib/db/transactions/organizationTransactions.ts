import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

import { recordAuditEventTx } from "@/lib/db/transactions/auditTransactions"
import type {
  CreateOrganizationInput,
  InviteOrganizationMemberInput,
  UpdateMembershipInput,
} from "@/schemas/organizationSchemas"
import type { OrganizationRole } from "@/types/authzTypes"

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96)
}

export async function createOrganizationTx(
  tx: Prisma.TransactionClient,
  input: CreateOrganizationInput & { organizationId: string; actorUserId: string }
) {
  const organization = await tx.organization.create({
    data: {
      id: input.organizationId,
      name: input.name,
      slug: `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`,
      memberships: {
        create: {
          userId: input.actorUserId,
          role: "owner",
        },
      },
    },
    select: { id: true, slug: true },
  })

  await tx.user.update({
    where: { id: input.actorUserId },
    data: { selectedOrganizationId: organization.id },
  })

  await recordAuditEventTx(tx, {
    eventName: "organization.created",
    actorUserId: input.actorUserId,
    entityType: "organization",
    entityId: organization.id,
    organizationId: organization.id,
    metadata: { slug: organization.slug },
  })

  return organization
}

export async function createOrganizationInvitationTx(
  tx: Prisma.TransactionClient,
  input: InviteOrganizationMemberInput & {
    organizationId: string
    actorUserId: string
    expiresAt: Date
  }
) {
  const invitation = await tx.organizationInvitation.upsert({
    where: {
      organizationId_email_status: {
        organizationId: input.organizationId,
        email: input.email,
        status: "pending",
      },
    },
    create: {
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      invitedByUserId: input.actorUserId,
      expiresAt: input.expiresAt,
    },
    update: {
      role: input.role,
      invitedByUserId: input.actorUserId,
      expiresAt: input.expiresAt,
      acceptedAt: null,
    },
    select: { id: true, email: true, role: true, expiresAt: true },
  })

  await recordAuditEventTx(tx, {
    eventName: "organization.invitation.created",
    actorUserId: input.actorUserId,
    entityType: "organization_invitation",
    entityId: invitation.id,
    organizationId: input.organizationId,
    metadata: { role: invitation.role },
  })

  return invitation
}

type MembershipAuthorizationState = {
  target: {
    id: string
    organizationId: string
    role: OrganizationRole
  }
  ownerCount: number
}

export async function changeMembershipTx(
  tx: Prisma.TransactionClient,
  input: UpdateMembershipInput & { organizationId: string; actorUserId: string },
  authorize: (state: MembershipAuthorizationState) => void
) {
  const target = await tx.membership.findFirst({
    where: { id: input.membershipId, organizationId: input.organizationId },
    select: { id: true, organizationId: true, role: true },
  })
  if (!target) throw new Error("Membership not found.")

  const ownerCount = await tx.membership.count({
    where: { organizationId: input.organizationId, role: "owner" },
  })
  authorize({ target, ownerCount })

  if (input.role === null) {
    await tx.membership.delete({ where: { id: target.id } })
    await recordAuditEventTx(tx, {
      eventName: "organization.membership.removed",
      actorUserId: input.actorUserId,
      entityType: "membership",
      entityId: target.id,
      organizationId: input.organizationId,
      metadata: { previousRole: target.role },
    })
    return { id: target.id, removed: true as const }
  }

  const membership = await tx.membership.update({
    where: { id: target.id },
    data: { role: input.role },
    select: { id: true, role: true },
  })
  await recordAuditEventTx(tx, {
    eventName: "organization.membership.role_changed",
    actorUserId: input.actorUserId,
    entityType: "membership",
    entityId: target.id,
    organizationId: input.organizationId,
    metadata: { previousRole: target.role, nextRole: membership.role },
  })
  return { ...membership, removed: false as const }
}
