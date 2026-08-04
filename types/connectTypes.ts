export type ConnectAccountSnapshot = {
  accountId: string
  country: string
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirementsDueCount: number
  disabledReason: string | null
}

export type ConnectReadinessDTO = {
  status: "pending" | "restricted" | "ready"
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirementsDueCount: number
  disabledReason: string | null
  providerUpdatedAt: string
} | null

export type ConnectPaymentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "requires_capture"
  | "succeeded"
  | "canceled"

export type ConnectPaymentSnapshot = {
  connectPaymentId: string
  paymentIntentId: string
  connectedAccountId: string
  status: ConnectPaymentStatus
  amountMinor: number
  currency: string
  platformFeeMinor: number
  amountCapturableMinor: number
  amountReceivedMinor: number
  latestChargeId: string | null
}

export type ConnectRefundStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "canceled"

export type ConnectRefundSnapshot = {
  refundId: string
  paymentIntentId: string
  amountMinor: number
  status: ConnectRefundStatus
}

export type ConnectWebhookTrigger =
  | {
      provider: "stripe_connect"
      providerEventId: string
      eventType: string
      disposition: "account"
      accountId: string
      safeMetadata: Record<string, string | null>
    }
  | {
      provider: "stripe_connect"
      providerEventId: string
      eventType: string
      disposition: "checkout"
      checkoutSessionId: string
      safeMetadata: Record<string, string | null>
    }
  | {
      provider: "stripe_connect"
      providerEventId: string
      eventType: string
      disposition: "payment"
      paymentIntentId: string
      safeMetadata: Record<string, string | null>
    }
  | {
      provider: "stripe_connect"
      providerEventId: string
      eventType: string
      disposition: "refund"
      refundId: string
      paymentIntentId: string
      safeMetadata: Record<string, string | null>
    }
  | {
      provider: "stripe_connect"
      providerEventId: string
      eventType: string
      disposition: "ignore"
      safeMetadata: Record<string, string | null>
    }
