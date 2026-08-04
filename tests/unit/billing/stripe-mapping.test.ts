import { describe, expect, it } from "vitest"

import { mapStripeSubscriptionSnapshot } from "@/lib/integrations/stripe/billing"
import { mapVerifiedStripeWebhook } from "@/lib/integrations/stripe/webhooks"

describe("Stripe runtime mapping", () => {
  it("maps one recurring subscription item and every bounded field", () => {
    expect(
      mapStripeSubscriptionSnapshot({
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        created: 1_754_262_000,
        cancel_at_period_end: false,
        metadata: { organization_id: "not-authority" },
        items: {
          data: [
            {
              id: "si_1",
              quantity: 1,
              current_period_end: 1_756_940_400,
              price: { id: "price_core" },
            },
          ],
        },
      })
    ).toEqual({
      subscriptionId: "sub_1",
      customerId: "cus_1",
      status: "active",
      cancelAtPeriodEnd: false,
      providerCreatedAt: new Date("2025-08-03T23:00:00.000Z"),
      item: {
        subscriptionItemId: "si_1",
        priceId: "price_core",
        quantity: 1,
        currentPeriodEnd: new Date("2025-09-03T23:00:00.000Z"),
      },
    })
  })

  it("uses the verified event only as a bounded subscription trigger", () => {
    expect(
      mapVerifiedStripeWebhook({
        id: "evt_1",
        type: "customer.subscription.updated",
        data: { object: { id: "sub_1", metadata: { organization_id: "attacker" } } },
      })
    ).toEqual({
      ok: true,
      event: {
        provider: "stripe",
        providerEventId: "evt_1",
        eventType: "customer.subscription.updated",
        disposition: "process",
        subscriptionId: "sub_1",
        safeMetadata: {
          resource_type: "subscription",
          stripe_subscription_id: "sub_1",
        },
      },
    })
  })

  it("rejects a malformed supported subscription event", () => {
    expect(
      mapVerifiedStripeWebhook({
        id: "evt_bad",
        type: "customer.subscription.updated",
        data: { object: { id: "" } },
      })
    ).toEqual({ ok: false, reason: "malformed_payload" })
  })
})
