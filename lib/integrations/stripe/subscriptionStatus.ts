import type { BillingSubscriptionStatus } from "@/types/billingTypes"

export function mapStripeSubscriptionStatus(value: string): BillingSubscriptionStatus {
  switch (value) {
    case "trialing":
    case "active":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return value
    default:
      throw new Error("Unsupported Stripe subscription status.")
  }
}

export function statusGrantsCoreEntitlement(status: BillingSubscriptionStatus): boolean {
  return status === "active" || status === "trialing"
}
