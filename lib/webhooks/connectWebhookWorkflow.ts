import "server-only"

import { connectAccountStatus } from "@/lib/connect/status"
import { getPrisma } from "@/lib/db/prisma"
import {
  applyConnectAccountSnapshotTx,
  applyConnectPaymentSnapshotTx,
  applyConnectRefundSnapshotTx,
  finalizeConnectWebhookTx,
} from "@/lib/db/transactions/connectTransactions"
import {
  claimProviderWebhookEvent,
  finalizeIgnoredWebhookTx,
  markWebhookFailed,
} from "@/lib/db/transactions/webhookTransactions"
import { withTenantContext } from "@/lib/db/withTenantContext"
import {
  stripeConnectProvider,
  type StripeConnectProvider,
} from "@/lib/integrations/stripe/connect"
import type { PrismaClient } from "@/prisma/generated/prisma/client"
import type { ConnectPaymentSnapshot, ConnectWebhookTrigger } from "@/types/connectTypes"
import type { WebhookProcessingResult } from "@/types/webhookTypes"

const STALE_AFTER_MS = 5 * 60 * 1000

type ConnectWebhookOptions = {
  prisma?: PrismaClient
  provider?: StripeConnectProvider
  now?: Date
}

export async function reconcileConnectWebhook(
  event: ConnectWebhookTrigger,
  options: ConnectWebhookOptions = {}
): Promise<WebhookProcessingResult> {
  const prisma = options.prisma ?? getPrisma()
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const claim = await claimProviderWebhookEvent(prisma, event, now, STALE_AFTER_MS)
  if (claim.kind === "terminal") return { ok: true, status: "duplicate" }
  if (claim.kind === "processing") return { ok: true, status: "processing" }

  try {
    if (event.disposition === "ignore") {
      await prisma.$transaction((tx) => finalizeIgnoredWebhookTx(tx, claim, now))
      return { ok: true, status: "ignored" }
    }

    if (event.disposition === "account") {
      const snapshot = await provider.retrieveAccount(event.accountId)
      const organizationId = await resolveConnectOrganization(prisma, snapshot.accountId)
      await withTenantContext(
        organizationId,
        async (tx) => {
          await applyConnectAccountSnapshotTx(tx, {
            organizationId,
            snapshot,
            status: connectAccountStatus(snapshot),
            operation: "readiness",
            now,
          })
          await finalizeConnectWebhookTx(tx, claim, "processed", now)
        },
        { isolationLevel: "Serializable" },
        prisma
      )
      return { ok: true, status: "processed" }
    }

    if (event.disposition === "refund") {
      const refund = await provider.retrieveRefund(event.refundId, event.paymentIntentId)
      const payment = await provider.retrieveWebhookPaymentIntent(event.paymentIntentId)
      const organizationId = await resolveConnectOrganization(prisma, payment.connectedAccountId)
      await withTenantContext(
        organizationId,
        async (tx) => {
          await applyConnectPaymentSnapshotTx(tx, {
            organizationId,
            paymentId: payment.connectPaymentId,
            snapshot: payment,
            operation: "webhook",
            now,
          })
          await applyConnectRefundSnapshotTx(tx, {
            organizationId,
            paymentId: payment.connectPaymentId,
            snapshot: refund,
            operation: "webhook",
            now,
          })
          await finalizeConnectWebhookTx(tx, claim, "processed", now)
        },
        { isolationLevel: "Serializable" },
        prisma
      )
      return { ok: true, status: "processed" }
    }

    const paymentIntentId =
      event.disposition === "checkout"
        ? await provider.retrieveCheckoutPaymentIntent(event.checkoutSessionId)
        : event.paymentIntentId
    if (!paymentIntentId) throw new Error("Stripe Checkout Session has no PaymentIntent.")
    const payment = await provider.retrieveWebhookPaymentIntent(paymentIntentId)
    const organizationId = await resolveConnectOrganization(prisma, payment.connectedAccountId)
    await applyPaymentWebhook(prisma, organizationId, payment, claim, now, async (tx) => {
      if (event.disposition === "checkout") {
        const local = await tx.connectPayment.findUniqueOrThrow({
          where: { id: payment.connectPaymentId },
          select: { stripeCheckoutSessionId: true },
        })
        if (local.stripeCheckoutSessionId !== event.checkoutSessionId) {
          throw new Error("Stripe Checkout Session scope mismatch.")
        }
      }
    })
    return { ok: true, status: "processed" }
  } catch {
    await markWebhookFailed(prisma, claim)
    return { ok: false, status: "failed" }
  }
}

async function resolveConnectOrganization(prisma: PrismaClient, accountId: string) {
  const binding = await prisma.providerConnectAccountBinding.findUnique({
    where: { providerAccountId: accountId },
    select: { organizationId: true },
  })
  if (!binding) throw new Error("Stripe connected account is not bound to an organization.")
  return binding.organizationId
}

async function applyPaymentWebhook(
  prisma: PrismaClient,
  organizationId: string,
  payment: ConnectPaymentSnapshot,
  claim: Parameters<typeof finalizeConnectWebhookTx>[1],
  now: Date,
  beforeApply: (tx: Parameters<typeof applyConnectPaymentSnapshotTx>[0]) => Promise<void>
) {
  await withTenantContext(
    organizationId,
    async (tx) => {
      await beforeApply(tx)
      await applyConnectPaymentSnapshotTx(tx, {
        organizationId,
        paymentId: payment.connectPaymentId,
        snapshot: payment,
        operation: "webhook",
        now,
      })
      await finalizeConnectWebhookTx(tx, claim, "processed", now)
    },
    { isolationLevel: "Serializable" },
    prisma
  )
}
