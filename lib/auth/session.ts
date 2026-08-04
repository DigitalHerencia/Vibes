import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { getPrisma } from "@/lib/db/prisma"
import { deriveTenantContext } from "@/lib/authz/tenant"
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

  if (existingUser) {
    if (existingUser.status !== "active") {
      return null
    }

    return { userId, localUser: mapLocalUser(existingUser) }
  }

  const clerkUser = await currentUser()
  const primaryEmail =
    clerkUser?.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress

  const localUser = await prisma.user.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      email: primaryEmail ?? null,
      displayName: clerkUser?.fullName ?? clerkUser?.username ?? null,
      status: "active",
    },
    update: {
      email: primaryEmail ?? null,
      displayName: clerkUser?.fullName ?? clerkUser?.username ?? null,
      status: "active",
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      displayName: true,
      status: true,
    },
  })

  return {
    userId,
    localUser: mapLocalUser(localUser),
  }
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
      memberships: {
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
      },
    },
  })

  const tenant = user
    ? deriveTenantContext(context, user.memberships, user.selectedOrganizationId)
    : null

  if (!tenant) throw new Error("Active organization membership required.")
  return tenant
}
