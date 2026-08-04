import "server-only"

import type { Prisma, PrismaClient } from "@/prisma/generated/prisma/client"
import type { ClaimableProviderEvent, NormalizedClerkUserEvent } from "@/types/webhookTypes"

type TransactionHost = Pick<PrismaClient, "$transaction">

export type WebhookClaim =
  | { kind: "claimed"; ledgerId: string; attemptCount: number }
  | { kind: "terminal"; status: "processed" | "ignored" }
  | { kind: "processing" }

export async function claimProviderWebhookEvent(
  host: TransactionHost,
  event: ClaimableProviderEvent,
  now: Date,
  staleAfterMs: number
): Promise<WebhookClaim> {
  const staleBefore = new Date(now.getTime() - staleAfterMs)

  return host.$transaction(async (tx) => {
    await tx.providerWebhookEvent.createMany({
      data: [
        {
          provider: event.provider,
          providerEventId: event.providerEventId,
          eventType: event.eventType,
          safeMetadata: event.safeMetadata,
        },
      ],
      skipDuplicates: true,
    })

    const ledger = await tx.providerWebhookEvent.findUniqueOrThrow({
      where: {
        provider_providerEventId: {
          provider: event.provider,
          providerEventId: event.providerEventId,
        },
      },
      select: { id: true, eventType: true, status: true },
    })

    if (ledger.eventType !== event.eventType) {
      throw new Error("Provider event identifier was reused with a different event type.")
    }

    if (ledger.status === "processed" || ledger.status === "ignored") {
      return { kind: "terminal", status: ledger.status }
    }

    const claim = await tx.providerWebhookEvent.updateMany({
      where: {
        id: ledger.id,
        OR: [
          { status: { in: ["received", "failed"] } },
          { status: "processing", processingStartedAt: { lte: staleBefore } },
        ],
      },
      data: {
        status: "processing",
        processingStartedAt: now,
        lastAttemptAt: now,
        attemptCount: { increment: 1 },
        processingError: null,
      },
    })

    if (claim.count === 0) return { kind: "processing" }

    const claimed = await tx.providerWebhookEvent.findUniqueOrThrow({
      where: { id: ledger.id },
      select: { attemptCount: true },
    })
    return { kind: "claimed", ledgerId: ledger.id, attemptCount: claimed.attemptCount }
  })
}

export async function finalizeIgnoredWebhookTx(
  tx: Prisma.TransactionClient,
  claim: Extract<WebhookClaim, { kind: "claimed" }>,
  now: Date
) {
  await assertClaimFinalized(
    await tx.providerWebhookEvent.updateMany({
      where: { id: claim.ledgerId, status: "processing", attemptCount: claim.attemptCount },
      data: { status: "ignored", processedAt: now, processingStartedAt: null },
    })
  )
}

export async function processClerkUserWebhookTx(
  tx: Prisma.TransactionClient,
  event: NormalizedClerkUserEvent,
  claim: Extract<WebhookClaim, { kind: "claimed" }>,
  now: Date
) {
  const isDeleted = event.eventType === "user.deleted"
  await tx.user.createMany({
    data: [
      {
        clerkUserId: event.user.clerkUserId,
        email: event.user.email,
        displayName: event.user.displayName,
        status: isDeleted ? "disabled" : "active",
        identityProviderUpdatedAt: event.occurredAt,
      },
    ],
    skipDuplicates: true,
  })

  const applied = isDeleted
    ? await tx.user.updateMany({
        where: { clerkUserId: event.user.clerkUserId },
        data: { status: "disabled" },
      })
    : await tx.user.updateMany({
        where: {
          clerkUserId: event.user.clerkUserId,
          OR: [
            { identityProviderUpdatedAt: null },
            { identityProviderUpdatedAt: { lte: event.occurredAt } },
          ],
        },
        data: {
          email: event.user.email,
          displayName: event.user.displayName,
          status: "active",
          identityProviderUpdatedAt: event.occurredAt,
        },
      })

  if (applied.count === 0) {
    await assertClaimFinalized(
      await tx.providerWebhookEvent.updateMany({
        where: { id: claim.ledgerId, status: "processing", attemptCount: claim.attemptCount },
        data: { status: "ignored", processedAt: now, processingStartedAt: null },
      })
    )
    return "ignored" as const
  }

  const user = await tx.user.findUniqueOrThrow({
    where: { clerkUserId: event.user.clerkUserId },
    select: { id: true },
  })
  await tx.auditEvent.create({
    data: {
      eventName: event.eventType,
      actorType: "clerk",
      entityType: "user",
      entityId: user.id,
      metadata: event.safeMetadata,
    },
  })

  await assertClaimFinalized(
    await tx.providerWebhookEvent.updateMany({
      where: { id: claim.ledgerId, status: "processing", attemptCount: claim.attemptCount },
      data: { status: "processed", processedAt: now, processingStartedAt: null },
    })
  )
  return "processed" as const
}

async function assertClaimFinalized(result: { count: number }) {
  if (result.count !== 1) {
    throw new Error("Webhook claim was superseded before processing completed.")
  }
}

export async function markWebhookFailed(
  host: TransactionHost,
  claim: Extract<WebhookClaim, { kind: "claimed" }>
) {
  await host.$transaction((tx) =>
    tx.providerWebhookEvent.updateMany({
      where: { id: claim.ledgerId, status: "processing", attemptCount: claim.attemptCount },
      data: {
        status: "failed",
        processingStartedAt: null,
        processingError: "processing_failed",
      },
    })
  )
}
