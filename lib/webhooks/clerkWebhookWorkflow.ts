import "server-only"

import { getPrisma } from "@/lib/db/prisma"
import {
  claimProviderWebhookEvent,
  finalizeIgnoredWebhookTx,
  markWebhookFailed,
  processClerkUserWebhookTx,
} from "@/lib/db/transactions/webhookTransactions"
import type { PrismaClient } from "@/prisma/generated/prisma/client"
import type { NormalizedClerkEvent, WebhookProcessingResult } from "@/types/webhookTypes"

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000

type WorkflowOptions = {
  prisma?: PrismaClient
  now?: Date
  staleAfterMs?: number
}

export async function reconcileClerkWebhook(
  event: NormalizedClerkEvent,
  options: WorkflowOptions = {}
): Promise<WebhookProcessingResult> {
  const prisma = options.prisma ?? getPrisma()
  const now = options.now ?? new Date()
  const claim = await claimProviderWebhookEvent(
    prisma,
    event,
    now,
    options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS
  )

  if (claim.kind === "terminal") return { ok: true, status: "duplicate" }
  if (claim.kind === "processing") return { ok: true, status: "processing" }

  try {
    const finalStatus = await prisma.$transaction(async (tx) => {
      if (event.disposition === "ignore") {
        await finalizeIgnoredWebhookTx(tx, claim, now)
        return "ignored" as const
      } else {
        return processClerkUserWebhookTx(tx, event, claim, now)
      }
    })
    return { ok: true, status: finalStatus }
  } catch {
    await markWebhookFailed(prisma, claim)
    return { ok: false, status: "failed" }
  }
}
