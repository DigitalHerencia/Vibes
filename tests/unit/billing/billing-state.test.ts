import { describe, expect, it } from "vitest"

import { compareBillingState } from "@/lib/billing/billingState"
import type { StripeSubscriptionSnapshot } from "@/types/billingTypes"

const provider: StripeSubscriptionSnapshot = {
  subscriptionId: "sub_1",
  customerId: "cus_1",
  status: "active",
  cancelAtPeriodEnd: false,
  providerCreatedAt: new Date("2026-08-04T00:00:00.000Z"),
  item: {
    subscriptionItemId: "si_1",
    priceId: "price_core",
    quantity: 1,
    currentPeriodEnd: new Date("2026-09-04T00:00:00.000Z"),
  },
}

describe("billing reconciliation", () => {
  it("reports no drift for matching local normalized state", () => {
    expect(
      compareBillingState(
        {
          status: "active",
          stripePriceId: "price_core",
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date("2026-09-04T00:00:00.000Z"),
          entitlementActive: true,
        },
        provider
      )
    ).toEqual({ hasDrift: false, fields: [] })
  })

  it("detects drift without returning a repair operation", () => {
    const result = compareBillingState(
      {
        status: "past_due",
        stripePriceId: "price_old",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: null,
        entitlementActive: true,
      },
      provider
    )
    expect(result).toEqual({
      hasDrift: true,
      fields: ["status", "price", "cancel_at_period_end", "current_period_end"],
    })
    expect(result).not.toHaveProperty("repair")
  })
})
