import "server-only"

import type { Prisma, PrismaClient } from "@/prisma/generated/prisma/client"

import { getPrisma } from "@/lib/db/prisma"

type TransactionHost = Pick<PrismaClient, "$transaction">
type TransactionOptions = {
  isolationLevel?: Prisma.TransactionIsolationLevel
  maxWait?: number
  timeout?: number
}

export async function withTenantContext<T>(
  organizationId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions,
  host: TransactionHost = getPrisma()
): Promise<T> {
  if (!organizationId.trim()) throw new Error("Organization context is required.")

  return host.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_organization_id', ${organizationId}, true)`
    return operation(tx)
  }, options)
}
