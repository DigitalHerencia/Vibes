import type { BillingDrift, StripeSubscriptionSnapshot } from "@/types/billingTypes"

export type LocalBillingSnapshot = {
  status: string
  stripePriceId: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
  entitlementActive: boolean
} | null

export function compareBillingState(
  local: LocalBillingSnapshot,
  provider: StripeSubscriptionSnapshot | null
): BillingDrift {
  if (!local && !provider) return { hasDrift: false, fields: [] }
  if (!local || !provider) return { hasDrift: true, fields: ["subscription_missing"] }

  const fields: BillingDrift["fields"][number][] = []
  if (local.status !== provider.status) fields.push("status")
  if (local.stripePriceId !== provider.item.priceId) fields.push("price")
  if (local.cancelAtPeriodEnd !== provider.cancelAtPeriodEnd) fields.push("cancel_at_period_end")
  if (local.currentPeriodEnd?.getTime() !== provider.item.currentPeriodEnd?.getTime()) {
    fields.push("current_period_end")
  }
  const providerEntitled = provider.status === "active" || provider.status === "trialing"
  if (local.entitlementActive !== providerEntitled) fields.push("entitlement")
  return { hasDrift: fields.length > 0, fields }
}
