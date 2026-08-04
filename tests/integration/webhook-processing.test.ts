import { PrismaPg } from "@prisma/adapter-pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  claimProviderWebhookEvent,
  finalizeIgnoredWebhookTx,
} from "@/lib/db/transactions/webhookTransactions"
import { reconcileClerkWebhook } from "@/lib/webhooks/clerkWebhookWorkflow"
import { PrismaClient } from "@/prisma/generated/prisma/client"
import type { NormalizedClerkEvent, NormalizedClerkUserEvent } from "@/types/webhookTypes"

const adminUrl = process.env.TEST_DATABASE_ADMIN_URL
const hasDatabase = Boolean(adminUrl)

function userEvent(
  providerEventId: string,
  email = "person@example.com"
): NormalizedClerkUserEvent {
  const occurredAt = new Date("2026-08-04T00:00:00.000Z")
  return {
    provider: "clerk",
    providerEventId,
    eventType: "user.created",
    occurredAt,
    disposition: "process",
    user: { clerkUserId: `clerk_${providerEventId}`, email, displayName: "Webhook User" },
    safeMetadata: {
      clerk_user_id: `clerk_${providerEventId}`,
      provider_occurred_at: occurredAt.toISOString(),
      resource_type: "user",
    },
  }
}

function ignoredEvent(providerEventId: string): NormalizedClerkEvent {
  return {
    provider: "clerk",
    providerEventId,
    eventType: "session.created",
    occurredAt: null,
    disposition: "ignore",
    safeMetadata: { provider_occurred_at: null, resource_type: "session" },
  }
}

describe.skipIf(!hasDatabase)("provider webhook processing", () => {
  let prisma: PrismaClient

  beforeAll(() => {
    if (!adminUrl) throw new Error("Webhook integration database configuration missing.")
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: adminUrl }) })
  })

  afterAll(async () => {
    await prisma?.$disconnect()
  })

  it("allows one side effect for concurrent duplicate deliveries", async () => {
    const event = userEvent("concurrent_duplicate")
    const results = await Promise.all([
      reconcileClerkWebhook(event, { prisma }),
      reconcileClerkWebhook(event, { prisma }),
      reconcileClerkWebhook(event, { prisma }),
    ])

    expect(results.filter((result) => result.status === "processed")).toHaveLength(1)
    expect(results.every((result) => result.ok)).toBe(true)
    expect(
      await prisma.auditEvent.count({ where: { eventName: "user.created", entityType: "user" } })
    ).toBe(1)
    expect(
      await prisma.providerWebhookEvent.findUniqueOrThrow({
        where: {
          provider_providerEventId: {
            provider: "clerk",
            providerEventId: event.providerEventId,
          },
        },
        select: { status: true, attemptCount: true, processingError: true },
      })
    ).toEqual({ status: "processed", attemptCount: 1, processingError: null })
  })

  it("keeps a crash-after-claim busy until the stale retry window", async () => {
    const event = ignoredEvent("crash_after_claim")
    const startedAt = new Date("2026-08-04T00:00:00.000Z")
    const first = await claimProviderWebhookEvent(prisma, event, startedAt, 300_000)
    expect(first).toEqual(expect.objectContaining({ kind: "claimed", attemptCount: 1 }))

    await expect(
      claimProviderWebhookEvent(prisma, event, new Date(startedAt.getTime() + 299_999), 300_000)
    ).resolves.toEqual({ kind: "processing" })

    const retry = await claimProviderWebhookEvent(
      prisma,
      event,
      new Date(startedAt.getTime() + 300_001),
      300_000
    )
    expect(retry).toEqual(expect.objectContaining({ kind: "claimed", attemptCount: 2 }))

    if (retry.kind !== "claimed") throw new Error("Expected stale delivery to be reclaimed.")
    await prisma.$transaction((tx) =>
      finalizeIgnoredWebhookTx(tx, retry, new Date(startedAt.getTime() + 300_001))
    )
  })

  it("retries failed work without treating the ledger row as completion", async () => {
    const providerEventId = "failed_retry"
    const failed = await reconcileClerkWebhook(
      userEvent(providerEventId, `${"x".repeat(321)}@x.test`),
      {
        prisma,
      }
    )
    expect(failed).toEqual({ ok: false, status: "failed" })

    const retried = await reconcileClerkWebhook(userEvent(providerEventId), { prisma })
    expect(retried).toEqual({ ok: true, status: "processed" })
    expect(
      await prisma.providerWebhookEvent.findUniqueOrThrow({
        where: { provider_providerEventId: { provider: "clerk", providerEventId } },
        select: { status: true, attemptCount: true, processingError: true },
      })
    ).toEqual({ status: "processed", attemptCount: 2, processingError: null })
  })

  it("ignores out-of-order identity events without overwriting newer local state", async () => {
    const clerkUserId = "clerk_out_of_order"
    const newer = userEvent("newer_identity_event")
    newer.user.clerkUserId = clerkUserId
    newer.user.displayName = "Newer identity"
    newer.occurredAt = new Date("2026-08-04T02:00:00.000Z")
    newer.safeMetadata.clerk_user_id = clerkUserId
    newer.safeMetadata.provider_occurred_at = newer.occurredAt.toISOString()

    const older = userEvent("older_identity_event")
    older.user.clerkUserId = clerkUserId
    older.user.displayName = "Older identity"
    older.occurredAt = new Date("2026-08-04T01:00:00.000Z")
    older.safeMetadata.clerk_user_id = clerkUserId
    older.safeMetadata.provider_occurred_at = older.occurredAt.toISOString()

    await expect(reconcileClerkWebhook(newer, { prisma })).resolves.toEqual({
      ok: true,
      status: "processed",
    })
    await expect(reconcileClerkWebhook(older, { prisma })).resolves.toEqual({
      ok: true,
      status: "ignored",
    })
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { clerkUserId },
        select: { displayName: true, identityProviderUpdatedAt: true },
      })
    ).resolves.toEqual({
      displayName: "Newer identity",
      identityProviderUpdatedAt: newer.occurredAt,
    })
  })
})
