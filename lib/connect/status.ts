import type {
  ConnectAccountSnapshot,
  ConnectPaymentStatus,
  ConnectRefundStatus,
} from "@/types/connectTypes"

export function connectAccountStatus(
  snapshot: ConnectAccountSnapshot
): "pending" | "restricted" | "ready" {
  if (snapshot.chargesEnabled && snapshot.payoutsEnabled && snapshot.requirementsDueCount === 0) {
    return "ready"
  }
  if (snapshot.disabledReason || snapshot.detailsSubmitted) return "restricted"
  return "pending"
}

export function mapConnectPaymentStatus(value: string): ConnectPaymentStatus {
  switch (value) {
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
    case "processing":
    case "requires_capture":
    case "succeeded":
    case "canceled":
      return value
    default:
      throw new Error(`Unsupported Connect PaymentIntent status: ${value}`)
  }
}

export function mapConnectRefundStatus(value: string): ConnectRefundStatus {
  switch (value) {
    case "pending":
    case "requires_action":
    case "succeeded":
    case "failed":
    case "canceled":
      return value
    default:
      throw new Error(`Unsupported Connect refund status: ${value}`)
  }
}
