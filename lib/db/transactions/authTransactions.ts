import type { Prisma } from "@/prisma/generated/prisma/client"

export async function upsertUserFromClerkTx(
  tx: Prisma.TransactionClient,
  input: {
    clerkUserId: string
    email?: string | null
    displayName?: string | null
  }
) {
  return tx.user.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: {
      clerkUserId: input.clerkUserId,
      email: input.email ?? null,
      displayName: input.displayName ?? null,
      status: "active",
    },
    update: {
      email: input.email ?? null,
      displayName: input.displayName ?? null,
      status: "active",
    },
  })
}
