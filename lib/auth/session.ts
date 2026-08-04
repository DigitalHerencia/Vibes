import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/db/prisma"
import type { AuthenticatedUserContext, LocalUserContext } from "@/types/authTypes"

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
