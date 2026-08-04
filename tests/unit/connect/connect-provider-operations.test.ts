import { beforeEach, describe, expect, it, vi } from "vitest"

const stripe = vi.hoisted(() => ({
  paymentIntents: {
    retrieve: vi.fn(),
    capture: vi.fn(),
    cancel: vi.fn(),
  },
  refunds: { create: vi.fn(), retrieve: vi.fn() },
}))

vi.mock("@/lib/integrations/stripe/client", () => ({ getStripe: () => stripe }))

import { stripeConnectProvider } from "@/lib/integrations/stripe/connect"

function payment(status: "requires_capture" | "succeeded") {
  return {
    id: "pi_1",
    status,
    amount: 1000,
    currency: "usd",
    application_fee_amount: 100,
    amount_capturable: status === "requires_capture" ? 1000 : 0,
    amount_received: status === "succeeded" ? 1000 : 0,
    latest_charge: "ch_1",
    transfer_data: { destination: "acct_1" },
    metadata: { connect_payment_id: "payment_1" },
  }
}

beforeEach(() => vi.clearAllMocks())

describe("Connect settlement operations", () => {
  it("retrieves current scoped state before idempotent capture", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue(payment("requires_capture"))
    stripe.paymentIntents.capture.mockResolvedValue(payment("succeeded"))
    await expect(
      stripeConnectProvider.capturePaymentIntent("pi_1", "acct_1", "capture:payment_1")
    ).resolves.toEqual(
      expect.objectContaining({ status: "succeeded", connectedAccountId: "acct_1" })
    )
    expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith("pi_1")
    expect(stripe.paymentIntents.capture).toHaveBeenCalledWith(
      "pi_1",
      {},
      { idempotencyKey: "capture:payment_1" }
    )
    expect(stripe.paymentIntents.retrieve.mock.invocationCallOrder[0]).toBeLessThan(
      stripe.paymentIntents.capture.mock.invocationCallOrder[0] ?? 0
    )
  })

  it("rejects account-scope mismatch before capture", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue(payment("requires_capture"))
    await expect(
      stripeConnectProvider.capturePaymentIntent("pi_1", "acct_other", "capture:payment_1")
    ).rejects.toThrow(/scope mismatch/)
    expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
  })

  it("fully refunds the charge while reversing transfer and application fee", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue(payment("succeeded"))
    stripe.refunds.create.mockResolvedValue({
      id: "re_1",
      payment_intent: "pi_1",
      amount: 1000,
      status: "succeeded",
    })
    await expect(
      stripeConnectProvider.createFullRefund({
        chargeId: "ch_1",
        paymentIntentId: "pi_1",
        connectedAccountId: "acct_1",
        idempotencyKey: "refund:payment_1:full",
      })
    ).resolves.toEqual(expect.objectContaining({ refundId: "re_1", status: "succeeded" }))
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        charge: "ch_1",
        reverse_transfer: true,
        refund_application_fee: true,
      }),
      { idempotencyKey: "refund:payment_1:full" }
    )
  })
})
