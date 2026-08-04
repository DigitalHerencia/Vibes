import { describe, expect, it } from "vitest"

import { mapVerifiedConnectWebhook } from "@/lib/integrations/stripe/connectWebhooks"

describe("Connect webhook mapping", () => {
  it("maps readiness, capture, and refund triggers without trusting object state", () => {
    expect(
      mapVerifiedConnectWebhook({
        id: "evt_account",
        type: "account.updated",
        data: { object: { id: "acct_1", charges_enabled: true } },
      })
    ).toEqual({
      ok: true,
      event: expect.objectContaining({
        provider: "stripe_connect",
        disposition: "account",
        accountId: "acct_1",
      }),
    })
    expect(
      mapVerifiedConnectWebhook({
        id: "evt_capture",
        type: "payment_intent.amount_capturable_updated",
        data: { object: { id: "pi_1", amount_capturable: 999 } },
      })
    ).toEqual({
      ok: true,
      event: expect.objectContaining({ disposition: "payment", paymentIntentId: "pi_1" }),
    })
    expect(
      mapVerifiedConnectWebhook({
        id: "evt_refund",
        type: "refund.updated",
        data: { object: { id: "re_1", payment_intent: "pi_1" } },
      })
    ).toEqual({
      ok: true,
      event: expect.objectContaining({
        disposition: "refund",
        refundId: "re_1",
        paymentIntentId: "pi_1",
      }),
    })
  })

  it("rejects malformed supported events and safely ignores unsupported ones", () => {
    expect(
      mapVerifiedConnectWebhook({
        id: "evt_bad",
        type: "refund.updated",
        data: { object: { id: "re_1" } },
      })
    ).toEqual({ ok: false, reason: "malformed_payload" })
    expect(
      mapVerifiedConnectWebhook({
        id: "evt_other",
        type: "balance.available",
        data: { object: { id: "ba_1" } },
      })
    ).toEqual({
      ok: true,
      event: expect.objectContaining({ disposition: "ignore" }),
    })
  })
})
