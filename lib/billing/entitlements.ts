import type { BillingSubscriptionStatus } from "@/types/billingTypes"

export function statusGrantsCoreEntitlement(status: BillingSubscriptionStatus): boolean {
  return status === "active" || status === "trialing"
}
