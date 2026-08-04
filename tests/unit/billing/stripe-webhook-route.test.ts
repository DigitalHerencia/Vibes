import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createStripeWebhookPostHandler } from "@/app/api/stripe/webhooks/route"

function request(withSignature = true) {
  return new Request("http://localhost/api/stripe/webhooks", {
    method: "POST",
    headers: withSignature ? { "stripe-signature": "signed" } : {},
    body: "raw-body",
  })
}

describe("Stripe webhook route", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_only"
  })
  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    vi.restoreAllMocks()
  })

  it("fails safely when raw-body signature verification fails", async () => {
    const reconcile = vi.fn()
    const handler = createStripeWebhookPostHandler({
      verify: vi.fn(() => {
        throw new Error("invalid")
      }),
      reconcile,
    })
    expect((await handler(request())).status).toBe(400)
    expect(reconcile).not.toHaveBeenCalled()
  })

  it("fails safely for a malformed verified envelope", async () => {
    const reconcile = vi.fn()
    const handler = createStripeWebhookPostHandler({
      verify: vi.fn(() => ({ id: "", type: "", data: {} })),
      reconcile,
    })
    expect((await handler(request())).status).toBe(400)
    expect(reconcile).not.toHaveBeenCalled()
  })
})
