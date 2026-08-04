import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { NextRequest, NextResponse } from "next/server"

import { getOptionalEnv } from "@/lib/env"
import { mapVerifiedClerkWebhook } from "@/lib/integrations/clerk/webhooks"
import { reconcileClerkWebhook } from "@/lib/webhooks/clerkWebhookWorkflow"

type HandlerDependencies = {
  verify: (request: NextRequest, options: { signingSecret: string }) => Promise<unknown>
  reconcile: typeof reconcileClerkWebhook
}

export function createClerkWebhookPostHandler(dependencies: HandlerDependencies) {
  return async function clerkWebhookPost(request: NextRequest) {
    const secret = getOptionalEnv("CLERK_WEBHOOK_SIGNING_SECRET")

    if (!secret) {
      return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
    }

    const providerEventId = request.headers.get("svix-id")
    if (!providerEventId || providerEventId.length > 255) {
      return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 })
    }

    let verifiedEvent: unknown
    try {
      verifiedEvent = await dependencies.verify(request, { signingSecret: secret })
    } catch {
      return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 })
    }

    const mapped = mapVerifiedClerkWebhook(verifiedEvent, providerEventId)
    if (!mapped.ok) {
      return NextResponse.json({ error: "Malformed webhook payload." }, { status: 400 })
    }

    const result = await dependencies.reconcile(mapped.event)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }
}

export const POST = createClerkWebhookPostHandler({
  verify: verifyWebhook,
  reconcile: reconcileClerkWebhook,
})
