import "server-only"

import { clerkUserWebhookSchema, clerkWebhookEnvelopeSchema } from "@/schemas/clerkWebhookSchemas"
import type { NormalizedClerkEvent } from "@/types/webhookTypes"

export type ClerkWebhookMappingResult =
  | { ok: true; event: NormalizedClerkEvent }
  | { ok: false; reason: "malformed_payload" }

function resourceType(eventType: string): string {
  return eventType.split(".")[0]?.slice(0, 80) || "unknown"
}

function providerDate(timestamp: number): Date {
  return new Date(timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp)
}

export function mapVerifiedClerkWebhook(
  value: unknown,
  providerEventId: string
): ClerkWebhookMappingResult {
  const envelope = clerkWebhookEnvelopeSchema.safeParse(value)
  if (!envelope.success) return { ok: false, reason: "malformed_payload" }

  if (
    envelope.data.type !== "user.created" &&
    envelope.data.type !== "user.updated" &&
    envelope.data.type !== "user.deleted"
  ) {
    return {
      ok: true,
      event: {
        provider: "clerk",
        providerEventId,
        eventType: envelope.data.type,
        occurredAt: null,
        disposition: "ignore",
        safeMetadata: {
          provider_occurred_at: null,
          resource_type: resourceType(envelope.data.type),
        },
      },
    }
  }

  const parsed = clerkUserWebhookSchema.safeParse(value)
  if (!parsed.success) return { ok: false, reason: "malformed_payload" }

  if (parsed.data.type === "user.deleted") {
    return {
      ok: true,
      event: {
        provider: "clerk",
        providerEventId,
        eventType: "user.deleted",
        occurredAt: null,
        disposition: "process",
        user: { clerkUserId: parsed.data.data.id, email: null, displayName: null },
        safeMetadata: {
          clerk_user_id: parsed.data.data.id,
          provider_occurred_at: null,
          resource_type: "user",
        },
      },
    }
  }

  const data = parsed.data.data
  const primaryEmail =
    data.email_addresses?.find((email) => email.id === data.primary_email_address_id)
      ?.email_address ?? data.email_addresses?.[0]?.email_address
  const fullName = [data.first_name, data.last_name]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim()
    .slice(0, 120)
  const occurredAt = providerDate(data.updated_at)

  return {
    ok: true,
    event: {
      provider: "clerk",
      providerEventId,
      eventType: parsed.data.type,
      occurredAt,
      disposition: "process",
      user: {
        clerkUserId: data.id,
        email: primaryEmail ?? null,
        displayName: fullName || data.username || null,
      },
      safeMetadata: {
        clerk_user_id: data.id,
        provider_occurred_at: occurredAt?.toISOString() ?? null,
        resource_type: "user",
      },
    },
  }
}
