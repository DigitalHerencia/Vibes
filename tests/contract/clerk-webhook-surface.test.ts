import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

describe("Clerk identity and webhook contracts", () => {
  it("keeps one public canonical route with official verification", () => {
    const route = read("app/api/clerk/webhooks/route.ts")
    const proxy = read("proxy.ts")
    expect(proxy).toContain('"/api/clerk/webhooks"')
    expect(route).toContain('from "@clerk/nextjs/webhooks"')
    expect(route).toContain("verifyWebhook")
    expect(route).toContain("CLERK_WEBHOOK_SIGNING_SECRET")
  })

  it("keeps session lookup read-only and local RBAC canonical", () => {
    const session = read("lib/auth/session.ts")
    const mapper = read("lib/integrations/clerk/webhooks.ts")
    expect(session).not.toMatch(/currentUser|\.user\.(?:create|update|upsert)/)
    expect(mapper).not.toMatch(/public_metadata|private_metadata|unsafe_metadata/)
  })

  it("defines atomic claim and retry state", () => {
    const schema = read("prisma/schema.prisma")
    const transactions = read("lib/db/transactions/webhookTransactions.ts")
    for (const status of ["received", "processing", "processed", "ignored", "failed"]) {
      expect(schema).toContain(status)
    }
    expect(transactions).toContain("updateMany")
    expect(transactions).toContain("processingStartedAt")
    expect(transactions).toContain("attemptCount")
    expect(transactions).not.toContain("find-then-create")
  })
})
