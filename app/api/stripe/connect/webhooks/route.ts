import { NextResponse } from "next/server"

import { getOptionalEnv } from "@/lib/env"
import { constructConnectWebhookEvent } from "@/lib/integrations/stripe/connect"
import { mapVerifiedConnectWebhook } from "@/lib/integrations/stripe/connectWebhooks"
import { reconcileConnectWebhook } from "@/lib/webhooks/connectWebhookWorkflow"

type HandlerDependencies = {
  verify: (payload: string, signature: string, secret: string) => unknown
  reconcile: typeof reconcileConnectWebhook
}

export function createConnectWebhookPostHandler(dependencies: HandlerDependencies) {
  return async function connectWebhookPost(request: Request) {
    const secret = getOptionalEnv("STRIPE_CONNECT_WEBHOOK_SECRET")
    const signature = request.headers.get("stripe-signature")
    if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
    if (!signature) return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 })

    let verified: unknown
    try {
      verified = dependencies.verify(await request.text(), signature, secret)
    } catch {
      return NextResponse.json({ error: "Invalid webhook request." }, { status: 400 })
    }
    const mapped = mapVerifiedConnectWebhook(verified)
    if (!mapped.ok) {
      return NextResponse.json({ error: "Malformed webhook payload." }, { status: 400 })
    }
    const result = await dependencies.reconcile(mapped.event)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }
}

export const POST = createConnectWebhookPostHandler({
  verify: constructConnectWebhookEvent,
  reconcile: reconcileConnectWebhook,
})
