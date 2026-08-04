import { afterEach, describe, expect, it, vi } from "vitest"

import { createConnectWebhookPostHandler } from "@/app/api/stripe/connect/webhooks/route"

const originalSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET

afterEach(() => {
  if (originalSecret === undefined) delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  else process.env.STRIPE_CONNECT_WEBHOOK_SECRET = originalSecret
})

describe("Connect webhook route", () => {
  it("fails closed without configuration or a valid signature", async () => {
    delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    const handler = createConnectWebhookPostHandler({ verify: vi.fn(), reconcile: vi.fn() })
    expect((await handler(new Request("http://localhost", { method: "POST" }))).status).toBe(503)

    process.env.STRIPE_CONNECT_WEBHOOK_SECRET = "whsec_test"
    const invalid = createConnectWebhookPostHandler({
      verify: vi.fn(() => {
        throw new Error("invalid")
      }),
      reconcile: vi.fn(),
    })
    expect(
      (
        await invalid(
          new Request("http://localhost", {
            method: "POST",
            headers: { "stripe-signature": "bad" },
            body: "{}",
          })
        )
      ).status
    ).toBe(400)
  })
})
