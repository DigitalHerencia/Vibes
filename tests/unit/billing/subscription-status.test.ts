import { describe, expect, it } from "vitest"

import { statusGrantsCoreEntitlement } from "@/lib/billing/entitlements"
import { mapStripeSubscriptionStatus } from "@/lib/integrations/stripe/subscriptionStatus"

describe("Stripe subscription status mapping", () => {
  it.each([
    "trialing",
    "active",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
  ] as const)("maps supported status %s explicitly", (status) => {
    expect(mapStripeSubscriptionStatus(status)).toBe(status)
  })

  it("rejects an unknown provider status", () => {
    expect(() => mapStripeSubscriptionStatus("mystery")).toThrow(
      "Unsupported Stripe subscription status."
    )
  })

  it("grants the simple-plan entitlement only for active or trialing", () => {
    expect(statusGrantsCoreEntitlement("active")).toBe(true)
    expect(statusGrantsCoreEntitlement("trialing")).toBe(true)
    expect(statusGrantsCoreEntitlement("past_due")).toBe(false)
    expect(statusGrantsCoreEntitlement("canceled")).toBe(false)
  })
})
