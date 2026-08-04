import { PrismaPg } from "@prisma/adapter-pg"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { reconcileConnectWebhook } from "@/lib/webhooks/connectWebhookWorkflow"
import type { StripeConnectProvider } from "@/lib/integrations/stripe/connect"
import { PrismaClient } from "@/prisma/generated/prisma/client"
import type {
  ConnectAccountSnapshot,
  ConnectPaymentSnapshot,
  ConnectRefundSnapshot,
  ConnectWebhookTrigger,
} from "@/types/connectTypes"

const adminUrl = process.env.TEST_DATABASE_ADMIN_URL
const hasDatabase = Boolean(adminUrl)
const organizationId = "connect_organization"
const paymentId = "connect_payment"

function accountSnapshot(): ConnectAccountSnapshot {
  return {
    accountId: "acct_connect",
    country: "US",
    detailsSubmitted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    requirementsDueCount: 0,
    disabledReason: null,
  }
}

function paymentSnapshot(
  status: ConnectPaymentSnapshot["status"] = "requires_capture"
): ConnectPaymentSnapshot {
  return {
    connectPaymentId: paymentId,
    paymentIntentId: "pi_connect",
    connectedAccountId: "acct_connect",
    status,
    amountMinor: 1000,
    currency: "usd",
    platformFeeMinor: 100,
    amountCapturableMinor: status === "requires_capture" ? 1000 : 0,
    amountReceivedMinor: status === "succeeded" ? 1000 : 0,
    latestChargeId: "ch_connect",
  }
}

function provider(overrides: Partial<StripeConnectProvider>): StripeConnectProvider {
  const unavailable = async () => {
    throw new Error("Unexpected provider call")
  }
  return {
    createAccount: unavailable,
    retrieveAccount: unavailable,
    createAccountLink: unavailable,
    createCheckoutSession: unavailable,
    retrieveCheckoutPaymentIntent: unavailable,
    retrievePaymentIntent: unavailable,
    retrieveWebhookPaymentIntent: unavailable,
    capturePaymentIntent: unavailable,
    cancelPaymentIntent: unavailable,
    createFullRefund: unavailable,
    retrieveRefund: unavailable,
    ...overrides,
  }
}

function event(
  providerEventId: string,
  value:
    | { disposition: "account"; accountId: string }
    | { disposition: "checkout"; checkoutSessionId: string }
    | { disposition: "payment"; paymentIntentId: string }
    | { disposition: "refund"; refundId: string; paymentIntentId: string }
    | { disposition: "ignore" }
): ConnectWebhookTrigger {
  const base = {
    provider: "stripe_connect" as const,
    providerEventId,
    safeMetadata: { resource_type: value.disposition },
  }
  switch (value.disposition) {
    case "account":
      return { ...base, eventType: "account.updated", ...value }
    case "checkout":
      return { ...base, eventType: "checkout.session.completed", ...value }
    case "payment":
      return { ...base, eventType: "payment_intent.amount_capturable_updated", ...value }
    case "refund":
      return { ...base, eventType: "refund.updated", ...value }
    case "ignore":
      return { ...base, eventType: "balance.available", ...value }
  }
}

describe.skipIf(!hasDatabase)("Stripe Connect lifecycle reconciliation", () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    if (!adminUrl) throw new Error("Connect integration database configuration missing.")
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: adminUrl }) })
    await prisma.organization.create({
      data: { id: organizationId, name: "Connect Tenant", slug: "connect-tenant" },
    })
    await prisma.connectAccount.create({
      data: {
        id: "connect_account",
        organizationId,
        stripeAccountId: "acct_connect",
        country: "US",
        providerUpdatedAt: new Date(),
      },
    })
    await prisma.providerConnectAccountBinding.create({
      data: { id: "connect_binding", providerAccountId: "acct_connect", organizationId },
    })
    await prisma.connectPayment.create({
      data: {
        id: paymentId,
        organizationId,
        connectAccountId: "connect_account",
        reference: "connect-order",
        stripeCheckoutSessionId: "cs_connect",
        amountMinor: 1000,
        currency: "usd",
        platformFeeMinor: 100,
        providerUpdatedAt: new Date(),
      },
    })
  })

  afterAll(async () => {
    await prisma?.$disconnect()
  })

  it("reconciles connected-account readiness from current provider state", async () => {
    await expect(
      reconcileConnectWebhook(
        event("evt_connect_account", { disposition: "account", accountId: "acct_connect" }),
        {
          prisma,
          provider: provider({ retrieveAccount: vi.fn().mockResolvedValue(accountSnapshot()) }),
        }
      )
    ).resolves.toEqual({ ok: true, status: "processed" })
    await expect(
      prisma.connectAccount.findUniqueOrThrow({
        where: { organizationId },
        select: { status: true, chargesEnabled: true, payoutsEnabled: true },
      })
    ).resolves.toEqual({ status: "ready", chargesEnabled: true, payoutsEnabled: true })
  })

  it("processes a concurrent authorization event exactly once", async () => {
    const retrieve = vi.fn().mockResolvedValue(paymentSnapshot())
    const connectProvider = provider({ retrieveWebhookPaymentIntent: retrieve })
    const trigger = event("evt_connect_capture", {
      disposition: "payment",
      paymentIntentId: "pi_connect",
    })
    const results = await Promise.all([
      reconcileConnectWebhook(trigger, { prisma, provider: connectProvider }),
      reconcileConnectWebhook(trigger, { prisma, provider: connectProvider }),
    ])
    expect(results.filter((result) => result.status === "processed")).toHaveLength(1)
    expect(retrieve).toHaveBeenCalledTimes(1)
    await expect(
      prisma.connectPayment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { status: true, amountCapturableMinor: true },
      })
    ).resolves.toEqual({ status: "requires_capture", amountCapturableMinor: 1000 })
  })

  it("retries failed provider recovery and applies current state", async () => {
    const retrieve = vi
      .fn<StripeConnectProvider["retrieveWebhookPaymentIntent"]>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(paymentSnapshot())
    const trigger = event("evt_connect_recovery", {
      disposition: "payment",
      paymentIntentId: "pi_connect",
    })
    await expect(
      reconcileConnectWebhook(trigger, {
        prisma,
        provider: provider({ retrieveWebhookPaymentIntent: retrieve }),
      })
    ).resolves.toEqual({ ok: false, status: "failed" })
    await expect(
      reconcileConnectWebhook(trigger, {
        prisma,
        provider: provider({ retrieveWebhookPaymentIntent: retrieve }),
      })
    ).resolves.toEqual({ ok: true, status: "processed" })
  })

  it("reconciles a full refund without double-counting retries", async () => {
    await reconcileConnectWebhook(
      event("evt_connect_succeeded", { disposition: "payment", paymentIntentId: "pi_connect" }),
      {
        prisma,
        provider: provider({
          retrieveWebhookPaymentIntent: vi.fn().mockResolvedValue(paymentSnapshot("succeeded")),
        }),
      }
    )
    const refund: ConnectRefundSnapshot = {
      refundId: "re_connect",
      paymentIntentId: "pi_connect",
      amountMinor: 1000,
      status: "succeeded",
    }
    const trigger = event("evt_connect_refund", {
      disposition: "refund",
      refundId: "re_connect",
      paymentIntentId: "pi_connect",
    })
    const connectProvider = provider({
      retrieveRefund: vi.fn().mockResolvedValue(refund),
      retrieveWebhookPaymentIntent: vi.fn().mockResolvedValue(paymentSnapshot("succeeded")),
    })
    await expect(
      reconcileConnectWebhook(trigger, { prisma, provider: connectProvider })
    ).resolves.toEqual({
      ok: true,
      status: "processed",
    })
    await expect(
      reconcileConnectWebhook(trigger, { prisma, provider: connectProvider })
    ).resolves.toEqual({
      ok: true,
      status: "duplicate",
    })
    await expect(
      prisma.connectPayment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { refundedAmountMinor: true },
      })
    ).resolves.toEqual({ refundedAmountMinor: 1000 })
  })
})
