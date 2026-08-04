import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

import type { BoundedAuditEvent } from "@/types/auditTypes"

export function recordAuditEventTx(tx: Prisma.TransactionClient, event: BoundedAuditEvent) {
  return tx.auditEvent.create({
    data: {
      ...event,
      actorType: "user",
    },
  })
}
