import { PrismaPg } from "@prisma/adapter-pg"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { reconcileStripeWebhook } from "@/lib/webhooks/stripeWebhookWorkflow"
import { PrismaClient } from "@/prisma/generated/prisma/client"
import type { StripeBillingProvider } from "@/lib/integrations/stripe/billing"
import type { StripeSubscriptionSnapshot, StripeWebhookTrigger } from "@/types/billingTypes"

const adminUrl = process.env.TEST_DATABASE_ADMIN_URL
const hasDatabase = Boolean(adminUrl)
const organizationId = "stripe_organization"

function snapshot(
  input: {
    subscriptionId?: string
    status?: StripeSubscriptionSnapshot["status"]
    created?: string
  } = {}
): StripeSubscriptionSnapshot {
  return {
    subscriptionId: input.subscriptionId ?? "sub_current",
    customerId: "cus_tenant",
    status: input.status ?? "active",
    cancelAtPeriodEnd: false,
    providerCreatedAt: new Date(input.created ?? "2026-08-04T02:00:00.000Z"),
    item: {
      subscriptionItemId: `si_${input.subscriptionId ?? "current"}`,
      priceId: "price_core",
      quantity: 1,
      currentPeriodEnd: new Date("2026-09-04T00:00:00.000Z"),
    },
  }
}

function trigger(providerEventId: string, subscriptionId = "sub_current"): StripeWebhookTrigger {
  return {
    provider: "stripe",
    providerEventId,
    eventType: "customer.subscription.updated",
    disposition: "process",
    subscriptionId,
    safeMetadata: { resource_type: "subscription", stripe_subscription_id: subscriptionId },
  }
}

function provider(
  retrieveSubscription: StripeBillingProvider["retrieveSubscription"]
): StripeBillingProvider {
  return {
    createCustomer: vi.fn(),
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
    retrieveSubscription,
    listSubscriptions: vi.fn(),
  }
}

describe.skipIf(!hasDatabase)("Stripe subscription webhook processing", () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    if (!adminUrl) throw new Error("Stripe integration database configuration missing.")
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: adminUrl }) })
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: "Stripe Tenant",
        slug: "stripe-tenant",
        updatedAt: new Date(),
      },
    })
    const customer = await prisma.billingCustomer.create({
      data: {
        id: "billing_customer",
        organizationId,
        stripeCustomerId: "cus_tenant",
        updatedAt: new Date(),
      },
    })
    await prisma.providerCustomerBinding.create({
      data: {
        id: "stripe_binding",
        provider: "stripe",
        providerCustomerId: "cus_tenant",
        organizationId,
      },
    })
    expect(customer.organizationId).toBe(organizationId)
  })

  afterAll(async () => {
    await prisma?.$disconnect()
  })

  it("processes concurrent duplicate delivery once", async () => {
    const load = vi.fn().mockResolvedValue(snapshot())
    const results = await Promise.all([
      reconcileStripeWebhook(trigger("evt_duplicate"), { prisma, provider: provider(load) }),
      reconcileStripeWebhook(trigger("evt_duplicate"), { prisma, provider: provider(load) }),
    ])
    expect(results.filter((result) => result.status === "processed")).toHaveLength(1)
    expect(load).toHaveBeenCalledTimes(1)
    await expect(
      prisma.billingEntitlement.findUniqueOrThrow({
        where: { organizationId_key: { organizationId, key: "core" } },
        select: { active: true },
      })
    ).resolves.toEqual({ active: true })
  })

  it("retries a provider read failure", async () => {
    const load = vi
      .fn<StripeBillingProvider["retrieveSubscription"]>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(snapshot({ status: "past_due" }))
    await expect(
      reconcileStripeWebhook(trigger("evt_retry"), { prisma, provider: provider(load) })
    ).resolves.toEqual({ ok: false, status: "failed" })
    await expect(
      reconcileStripeWebhook(trigger("evt_retry"), { prisma, provider: provider(load) })
    ).resolves.toEqual({ ok: true, status: "processed" })
    await expect(
      prisma.billingEntitlement.findUniqueOrThrow({
        where: { organizationId_key: { organizationId, key: "core" } },
        select: { active: true },
      })
    ).resolves.toEqual({ active: false })
  })

  it("ignores an older subscription after a newer replacement", async () => {
    await reconcileStripeWebhook(trigger("evt_newer", "sub_newer"), {
      prisma,
      provider: provider(
        vi.fn().mockResolvedValue(snapshot({ subscriptionId: "sub_newer", created: "2026-08-05" }))
      ),
    })
    await expect(
      reconcileStripeWebhook(trigger("evt_older", "sub_older"), {
        prisma,
        provider: provider(
          vi
            .fn()
            .mockResolvedValue(
              snapshot({ subscriptionId: "sub_older", status: "canceled", created: "2026-08-03" })
            )
        ),
      })
    ).resolves.toEqual({ ok: true, status: "ignored" })
    await expect(
      prisma.billingSubscription.findUniqueOrThrow({
        where: { organizationId },
        select: { stripeSubscriptionId: true },
      })
    ).resolves.toEqual({ stripeSubscriptionId: "sub_newer" })
  })
})
