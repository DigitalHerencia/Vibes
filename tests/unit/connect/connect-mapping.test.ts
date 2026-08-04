import { describe, expect, it } from "vitest"

import { connectAccountStatus, mapConnectPaymentStatus } from "@/lib/connect/status"
import {
  mapConnectAccountSnapshot,
  mapConnectPaymentSnapshot,
  mapConnectRefundSnapshot,
} from "@/lib/integrations/stripe/connect"

describe("Connect provider mapping", () => {
  it("maps readiness only when charges, payouts, and requirements agree", () => {
    const ready = mapConnectAccountSnapshot({
      id: "acct_1",
      country: "us",
      details_submitted: true,
      charges_enabled: true,
      payouts_enabled: true,
      requirements: { currently_due: [], disabled_reason: null },
    })
    expect(connectAccountStatus(ready)).toBe("ready")
    expect(connectAccountStatus({ ...ready, payoutsEnabled: false })).toBe("restricted")
  })

  it("maps and scope-preserves a manual destination PaymentIntent", () => {
    expect(
      mapConnectPaymentSnapshot({
        id: "pi_1",
        status: "requires_capture",
        amount: 1250,
        currency: "usd",
        application_fee_amount: 125,
        amount_capturable: 1250,
        amount_received: 0,
        latest_charge: { id: "ch_1" },
        transfer_data: { destination: { id: "acct_1" } },
        metadata: { connect_payment_id: "local_payment" },
      })
    ).toEqual({
      connectPaymentId: "local_payment",
      paymentIntentId: "pi_1",
      connectedAccountId: "acct_1",
      status: "requires_capture",
      amountMinor: 1250,
      currency: "usd",
      platformFeeMinor: 125,
      amountCapturableMinor: 1250,
      amountReceivedMinor: 0,
      latestChargeId: "ch_1",
    })
  })

  it("maps refund state and rejects unsupported provider statuses", () => {
    expect(
      mapConnectRefundSnapshot({
        id: "re_1",
        payment_intent: "pi_1",
        amount: 1250,
        status: "succeeded",
      })
    ).toEqual({
      refundId: "re_1",
      paymentIntentId: "pi_1",
      amountMinor: 1250,
      status: "succeeded",
    })
    expect(() => mapConnectPaymentStatus("unknown")).toThrow(/Unsupported/)
  })
})
