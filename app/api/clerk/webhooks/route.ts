import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"

import { getOptionalEnv } from "@/lib/env"

export async function POST(request: Request) {
  const secret = getOptionalEnv("CLERK_WEBHOOK_SECRET")

  if (!secret) {
    return NextResponse.json({ error: "Missing Clerk webhook secret." }, { status: 500 })
  }

  const headerStore = await headers()
  const svixId = headerStore.get("svix-id")
  const svixTimestamp = headerStore.get("svix-timestamp")
  const svixSignature = headerStore.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers." }, { status: 400 })
  }

  const payload = await request.text()
  const webhook = new Webhook(secret)

  let event: unknown

  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 })
  }

  const { processClerkWebhookEvent } = await import("@/lib/actions/authActions")
  const result = await processClerkWebhookEvent(
    event as { type: string; data: { id: string } },
    svixId
  )

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
