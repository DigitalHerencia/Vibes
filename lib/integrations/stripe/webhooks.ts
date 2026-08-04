import "server-only"

import {
  stripeSubscriptionTriggerSchema,
  stripeWebhookEnvelopeSchema,
} from "@/schemas/stripeWebhookSchemas"
import type { StripeWebhookTrigger } from "@/types/billingTypes"

export type StripeWebhookMappingResult =
  | { ok: true; event: StripeWebhookTrigger }
  | { ok: false; reason: "malformed_payload" }

export function mapVerifiedStripeWebhook(value: unknown): StripeWebhookMappingResult {
  const envelope = stripeWebhookEnvelopeSchema.safeParse(value)
  if (!envelope.success) return { ok: false, reason: "malformed_payload" }

  const supported = stripeSubscriptionTriggerSchema.safeParse(value)
  if (!supported.success) {
    if (
      envelope.data.type === "customer.subscription.created" ||
      envelope.data.type === "customer.subscription.updated" ||
      envelope.data.type === "customer.subscription.deleted"
    ) {
      return { ok: false, reason: "malformed_payload" }
    }
    return {
      ok: true,
      event: {
        provider: "stripe",
        providerEventId: envelope.data.id,
        eventType: envelope.data.type,
        disposition: "ignore",
        safeMetadata: {
          resource_type: envelope.data.type.split(".")[1]?.slice(0, 80) ?? "unknown",
        },
      },
    }
  }

  return {
    ok: true,
    event: {
      provider: "stripe",
      providerEventId: supported.data.id,
      eventType: supported.data.type,
      disposition: "process",
      subscriptionId: supported.data.data.object.id,
      safeMetadata: {
        resource_type: "subscription",
        stripe_subscription_id: supported.data.data.object.id,
      },
    },
  }
}
