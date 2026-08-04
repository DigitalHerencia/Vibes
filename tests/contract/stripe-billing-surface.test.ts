import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

describe("Stripe subscription billing boundaries", () => {
  it("keeps billing tenant-owned and entitlement local", () => {
    const schema = read("prisma/schema.prisma")
    expect(schema).toMatch(/model BillingCustomer[\s\S]*organizationId\s+String\s+@unique/)
    expect(schema).toMatch(/model BillingSubscription[\s\S]*organizationId\s+String\s+@unique/)
    expect(schema).toContain("model BillingEntitlement")
    const userModel = schema.match(/model User \{[\s\S]*?\n\}/)?.[0]
    expect(userModel).toBeDefined()
    expect(userModel).not.toContain("stripeCustomerId")
  })

  it("keeps customer, price, and return URLs out of action input", () => {
    const actions = read("lib/actions/billingActions.ts")
    const workflows = read("lib/billing/workflows/billingWorkflows.ts")
    expect(actions).toContain("createCheckoutSessionAction()")
    expect(actions).toContain("createBillingPortalSessionAction()")
    expect(actions).not.toMatch(/customerId|priceId|returnUrl/)
    expect(workflows).toContain('assertCapability(context, "billing.manage")')
    expect(workflows).toContain('getRequiredEnv("STRIPE_RECURRING_PRICE_ID")')
  })

  it("uses a verified raw-body webhook trigger and never redirect authority", () => {
    const route = read("app/api/stripe/webhooks/route.ts")
    const workflow = read("lib/webhooks/stripeWebhookWorkflow.ts")
    expect(route).toContain("await request.text()")
    expect(route).toContain("stripe-signature")
    expect(workflow).toContain("retrieveSubscription")
    expect(workflow).not.toMatch(/success_url|checkout.*complete/i)
  })
})
