import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createClerkWebhookPostHandler } from "@/app/api/clerk/webhooks/route"

function webhookRequest(withId = true) {
  return new NextRequest("http://localhost/api/clerk/webhooks", {
    method: "POST",
    headers: withId ? { "svix-id": "event_1" } : {},
    body: "{}",
  })
}

describe("Clerk webhook route", () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test_only"
  })

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET
    vi.restoreAllMocks()
  })

  it("fails safely when signature verification fails", async () => {
    const reconcile = vi.fn()
    const handler = createClerkWebhookPostHandler({
      verify: vi.fn().mockRejectedValue(new Error("invalid signature")),
      reconcile,
    })

    const response = await handler(webhookRequest())

    expect(response.status).toBe(400)
    expect(reconcile).not.toHaveBeenCalled()
  })

  it("fails safely when the verified payload is malformed", async () => {
    const reconcile = vi.fn()
    const handler = createClerkWebhookPostHandler({
      verify: vi.fn().mockResolvedValue({
        type: "user.created",
        data: { id: "", updated_at: Date.now() },
      }),
      reconcile,
    })

    const response = await handler(webhookRequest())

    expect(response.status).toBe(400)
    expect(reconcile).not.toHaveBeenCalled()
  })

  it("requires the provider event identifier before processing", async () => {
    const verify = vi.fn()
    const reconcile = vi.fn()
    const handler = createClerkWebhookPostHandler({ verify, reconcile })

    const response = await handler(webhookRequest(false))

    expect(response.status).toBe(400)
    expect(verify).not.toHaveBeenCalled()
    expect(reconcile).not.toHaveBeenCalled()
  })
})
