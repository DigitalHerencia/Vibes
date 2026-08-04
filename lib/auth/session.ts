import "server-only"

import { auth } from "@clerk/nextjs/server"

import { getPrisma } from "@/lib/db/prisma"
import { withTenantContext } from "@/lib/db/withTenantContext"
import { deriveTenantContext, type TenantMembershipRecord } from "@/lib/authz/tenant"
import type { AuthenticatedUserContext, LocalUserContext } from "@/types/authTypes"
import type { TenantContext } from "@/types/authzTypes"

function mapLocalUser(user: {
  id: string
  clerkUserId: string
  email: string | null
  displayName: string | null
  status: "active" | "disabled"
}): LocalUserContext {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
  }
}

export async function getCurrentUserContext(): Promise<AuthenticatedUserContext | null> {
  const { userId } = await auth()
  if (!userId) return null
  const prisma = getPrisma()

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      displayName: true,
      status: true,
    },
  })

  if (!existingUser || existingUser.status !== "active") return null

  return { userId, localUser: mapLocalUser(existingUser) }
}

export async function requireCurrentUserContext(): Promise<AuthenticatedUserContext> {
  const context = await getCurrentUserContext()

  if (!context) {
    throw new Error("Authentication required.")
  }

  return context
}

export async function requireTenantContext(): Promise<TenantContext> {
  const context = await requireCurrentUserContext()
  const prisma = getPrisma()
  const user = await prisma.user.findUnique({
    where: { id: context.localUser.id },
    select: {
      selectedOrganizationId: true,
    },
  })

  if (!user?.selectedOrganizationId) {
    throw new Error("Active organization membership required.")
  }
  const organizationId = user.selectedOrganizationId

  const membership = await withTenantContext<TenantMembershipRecord | null>(organizationId, (tx) =>
    tx.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: context.localUser.id,
        },
      },
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })
  )

  const tenant = membership ? deriveTenantContext(context, [membership], organizationId) : null

  if (!tenant) throw new Error("Active organization membership required.")
  return tenant
}
