import { describe, expect, it } from "vitest"

import { mapVerifiedClerkWebhook } from "@/lib/integrations/clerk/webhooks"

describe("Clerk webhook mapping", () => {
  it("rejects malformed user payloads at runtime", () => {
    expect(
      mapVerifiedClerkWebhook(
        { type: "user.created", data: { id: "", updated_at: 1_754_262_000_000 } },
        "event_1"
      )
    ).toEqual({ ok: false, reason: "malformed_payload" })
  })

  it("maps only bounded identity fields and excludes provider metadata", () => {
    const result = mapVerifiedClerkWebhook(
      {
        type: "user.updated",
        data: {
          id: "user_1",
          primary_email_address_id: "email_1",
          email_addresses: [{ id: "email_1", email_address: "person@example.com" }],
          first_name: "Ada",
          last_name: "Lovelace",
          updated_at: 1_754_262_000_000,
          public_metadata: { role: "owner", capability: "billing.manage" },
          private_metadata: { tenantId: "attacker-controlled" },
        },
      },
      "event_2"
    )

    expect(result).toEqual({
      ok: true,
      event: {
        provider: "clerk",
        providerEventId: "event_2",
        eventType: "user.updated",
        occurredAt: new Date("2025-08-03T23:00:00.000Z"),
        disposition: "process",
        user: {
          clerkUserId: "user_1",
          email: "person@example.com",
          displayName: "Ada Lovelace",
        },
        safeMetadata: {
          clerk_user_id: "user_1",
          provider_occurred_at: "2025-08-03T23:00:00.000Z",
          resource_type: "user",
        },
      },
    })
  })

  it("classifies verified unsupported events as ignored", () => {
    expect(
      mapVerifiedClerkWebhook(
        {
          type: "session.created",
          data: { id: "session_1", secret: "not-stored" },
        },
        "event_3"
      )
    ).toEqual({
      ok: true,
      event: {
        provider: "clerk",
        providerEventId: "event_3",
        eventType: "session.created",
        occurredAt: null,
        disposition: "ignore",
        safeMetadata: {
          provider_occurred_at: null,
          resource_type: "session",
        },
      },
    })
  })
})
