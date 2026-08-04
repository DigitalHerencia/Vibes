export type BillingSubscriptionStatus =
  | "trialing"
  | "active"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"

export type StripeSubscriptionSnapshot = {
  subscriptionId: string
  customerId: string
  status: BillingSubscriptionStatus
  cancelAtPeriodEnd: boolean
  providerCreatedAt: Date
  item: {
    subscriptionItemId: string
    priceId: string
    quantity: number
    currentPeriodEnd: Date | null
  }
}

export type StripeWebhookTrigger = ClaimableStripeTrigger | IgnoredStripeTrigger

type StripeTriggerBase = {
  provider: "stripe"
  providerEventId: string
  eventType: string
  safeMetadata: Record<string, string | null>
}

export type ClaimableStripeTrigger = StripeTriggerBase & {
  disposition: "process"
  subscriptionId: string
}

export type IgnoredStripeTrigger = StripeTriggerBase & {
  disposition: "ignore"
}

export type BillingDrift = {
  hasDrift: boolean
  fields: readonly (
    | "subscription_missing"
    | "status"
    | "price"
    | "cancel_at_period_end"
    | "current_period_end"
    | "entitlement"
  )[]
}
