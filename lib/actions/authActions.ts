"use server"

import type { Prisma } from "@/prisma/generated/prisma/client"

import { getPrisma } from "@/lib/db/prisma"
import { upsertUserFromClerkTx } from "@/lib/db/transactions/authTransactions"

type ClerkWebhookUserData = {
  id: string
  email_addresses?: Array<{
    id?: string
    email_address?: string
  }>
  primary_email_address_id?: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

type ClerkWebhookEvent = {
  type: string
  data: ClerkWebhookUserData
}

function extractEmail(data: ClerkWebhookUserData): string | null {
  return (
    data.email_addresses?.find((email) => email.id === data.primary_email_address_id)
      ?.email_address ??
    data.email_addresses?.[0]?.email_address ??
    null
  )
}

function extractDisplayName(data: ClerkWebhookUserData): string | null {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim()
  return fullName || data.username || null
}

function safeMetadata(event: ClerkWebhookEvent): Prisma.InputJsonObject {
  return {
    clerk_user_id: event.data.id,
    resource_type: event.type.split(".")[0] ?? "unknown",
  }
}

export async function recordProviderWebhookReceived(input: {
  providerEventId: string
  eventType: string
  safeMetadata?: Prisma.InputJsonValue
}) {
  const prisma = getPrisma()
  const existing = await prisma.providerWebhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: "clerk",
        providerEventId: input.providerEventId,
      },
    },
  })

  if (existing) {
    return { duplicate: true as const, event: existing }
  }

  const event = await prisma.providerWebhookEvent.create({
    data: {
      provider: "clerk",
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      safeMetadata: input.safeMetadata ?? {},
    },
  })

  return { duplicate: false as const, event }
}

export async function processClerkWebhookEvent(event: ClerkWebhookEvent, providerEventId: string) {
  const prisma = getPrisma()
  const ledger = await recordProviderWebhookReceived({
    providerEventId,
    eventType: event.type,
    safeMetadata: safeMetadata(event),
  })

  if (ledger.duplicate || ledger.event.processed) {
    return { ok: true as const, status: "duplicate" as const }
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const user = await prisma.$transaction((tx) =>
        upsertUserFromClerkTx(tx, {
          clerkUserId: event.data.id,
          email: extractEmail(event.data),
          displayName: extractDisplayName(event.data),
        })
      )

      await prisma.auditEvent.create({
        data: {
          eventName: event.type,
          actorType: "clerk",
          entityType: "user",
          entityId: user.id,
          actorUserId: user.id,
          metadata: safeMetadata(event),
        },
      })
    } else if (event.type === "user.deleted") {
      await prisma.user.updateMany({
        where: { clerkUserId: event.data.id },
        data: { status: "disabled" },
      })
    }

    await prisma.providerWebhookEvent.update({
      where: { id: ledger.event.id },
      data: { status: "processed", processed: true, processedAt: new Date() },
    })

    return { ok: true as const, status: "processed" as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed."
    await prisma.providerWebhookEvent.update({
      where: { id: ledger.event.id },
      data: { status: "failed", processingError: message },
    })

    return { ok: false as const, status: "failed" as const, message }
  }
}
