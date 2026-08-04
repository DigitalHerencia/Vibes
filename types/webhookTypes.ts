export type ClerkUserEventType = "user.created" | "user.updated" | "user.deleted"

type NormalizedClerkUserEventBase = {
  provider: "clerk"
  providerEventId: string
  disposition: "process"
  user: {
    clerkUserId: string
    email: string | null
    displayName: string | null
  }
  safeMetadata: {
    clerk_user_id: string
    provider_occurred_at: string | null
    resource_type: "user"
  }
}

export type NormalizedClerkUserEvent = NormalizedClerkUserEventBase &
  (
    | { eventType: "user.created" | "user.updated"; occurredAt: Date }
    | { eventType: "user.deleted"; occurredAt: null }
  )

export type IgnoredClerkEvent = {
  provider: "clerk"
  providerEventId: string
  eventType: string
  occurredAt: null
  disposition: "ignore"
  safeMetadata: {
    provider_occurred_at: null
    resource_type: string
  }
}

export type NormalizedClerkEvent = NormalizedClerkUserEvent | IgnoredClerkEvent

export type ClaimableProviderEvent = {
  provider: "clerk" | "stripe" | "stripe_connect"
  providerEventId: string
  eventType: string
  safeMetadata: Record<string, string | null>
}

export type WebhookProcessingResult = {
  ok: boolean
  status: "processed" | "ignored" | "duplicate" | "processing" | "failed"
}
