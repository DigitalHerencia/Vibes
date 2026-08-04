import "server-only"

import {
  connectRefundTriggerSchema,
  connectWebhookEnvelopeSchema,
  connectWebhookObjectSchema,
} from "@/schemas/connectSchemas"
import type { ConnectWebhookTrigger } from "@/types/connectTypes"

export type ConnectWebhookMappingResult =
  | { ok: true; event: ConnectWebhookTrigger }
  | { ok: false; reason: "malformed_payload" }

const accountEvents = new Set(["account.updated"])
const checkoutEvents = new Set(["checkout.session.completed"])
const paymentEvents = new Set([
  "payment_intent.amount_capturable_updated",
  "payment_intent.canceled",
  "payment_intent.payment_failed",
  "payment_intent.processing",
  "payment_intent.succeeded",
])
const refundEvents = new Set(["refund.created", "refund.updated", "refund.failed"])

export function mapVerifiedConnectWebhook(value: unknown): ConnectWebhookMappingResult {
  const envelope = connectWebhookEnvelopeSchema.safeParse(value)
  if (!envelope.success) return { ok: false, reason: "malformed_payload" }
  const object = connectWebhookObjectSchema.safeParse(envelope.data.data.object)
  const supported =
    accountEvents.has(envelope.data.type) ||
    checkoutEvents.has(envelope.data.type) ||
    paymentEvents.has(envelope.data.type) ||
    refundEvents.has(envelope.data.type)

  if (supported && !object.success) return { ok: false, reason: "malformed_payload" }
  if (!object.success) {
    return {
      ok: true,
      event: {
        provider: "stripe_connect",
        providerEventId: envelope.data.id,
        eventType: envelope.data.type,
        disposition: "ignore",
        safeMetadata: { resource_type: "unknown" },
      },
    }
  }

  const base = {
    provider: "stripe_connect" as const,
    providerEventId: envelope.data.id,
    eventType: envelope.data.type,
  }
  if (accountEvents.has(envelope.data.type)) {
    return {
      ok: true,
      event: {
        ...base,
        disposition: "account",
        accountId: object.data.id,
        safeMetadata: { resource_type: "account", stripe_account_id: object.data.id },
      },
    }
  }
  if (checkoutEvents.has(envelope.data.type)) {
    return {
      ok: true,
      event: {
        ...base,
        disposition: "checkout",
        checkoutSessionId: object.data.id,
        safeMetadata: { resource_type: "checkout_session", stripe_session_id: object.data.id },
      },
    }
  }
  if (paymentEvents.has(envelope.data.type)) {
    return {
      ok: true,
      event: {
        ...base,
        disposition: "payment",
        paymentIntentId: object.data.id,
        safeMetadata: { resource_type: "payment_intent", stripe_payment_intent_id: object.data.id },
      },
    }
  }
  if (refundEvents.has(envelope.data.type)) {
    const refund = connectRefundTriggerSchema.safeParse(envelope.data.data.object)
    if (!refund.success) return { ok: false, reason: "malformed_payload" }
    return {
      ok: true,
      event: {
        ...base,
        disposition: "refund",
        refundId: refund.data.id,
        paymentIntentId: refund.data.payment_intent,
        safeMetadata: { resource_type: "refund", stripe_refund_id: refund.data.id },
      },
    }
  }
  return {
    ok: true,
    event: {
      ...base,
      disposition: "ignore",
      safeMetadata: { resource_type: envelope.data.type.split(".")[0]?.slice(0, 80) ?? "unknown" },
    },
  }
}
