import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

import type { StripeSubscriptionSnapshot } from "@/types/billingTypes"
import type { WebhookClaim } from "@/lib/db/transactions/webhookTransactions"

export async function upsertBillingCustomerTx(
  tx: Prisma.TransactionClient,
  input: { organizationId: string; stripeCustomerId: string }
) {
  const customer = await tx.billingCustomer.upsert({
    where: { organizationId: input.organizationId },
    create: input,
    update: { stripeCustomerId: input.stripeCustomerId },
  })
  await tx.providerCustomerBinding.createMany({
    data: [
      {
        provider: "stripe",
        providerCustomerId: input.stripeCustomerId,
        organizationId: input.organizationId,
      },
    ],
    skipDuplicates: true,
  })
  const binding = await tx.providerCustomerBinding.findUniqueOrThrow({
    where: {
      provider_providerCustomerId: {
        provider: "stripe",
        providerCustomerId: input.stripeCustomerId,
      },
    },
    select: { organizationId: true },
  })
  if (binding.organizationId !== input.organizationId) {
    throw new Error("Stripe customer is already bound to another organization.")
  }
  return customer
}

export async function applyStripeSubscriptionSnapshotTx(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    billingCustomerId: string
    snapshot: StripeSubscriptionSnapshot
    claim: Extract<WebhookClaim, { kind: "claimed" }>
    entitlementActive: boolean
    now: Date
  }
): Promise<"processed" | "ignored"> {
  const existing = await tx.billingSubscription.findUnique({
    where: { organizationId: input.organizationId },
    select: { providerCreatedAt: true },
  })

  if (existing && existing.providerCreatedAt > input.snapshot.providerCreatedAt) {
    await finalizeClaim(tx, input.claim, "ignored", input.now)
    return "ignored"
  }

  const subscription = await tx.billingSubscription.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      billingCustomerId: input.billingCustomerId,
      stripeSubscriptionId: input.snapshot.subscriptionId,
      status: input.snapshot.status,
      stripePriceId: input.snapshot.item.priceId,
      currentPeriodEnd: input.snapshot.item.currentPeriodEnd,
      cancelAtPeriodEnd: input.snapshot.cancelAtPeriodEnd,
      providerCreatedAt: input.snapshot.providerCreatedAt,
      providerUpdatedAt: input.now,
    },
    update: {
      billingCustomerId: input.billingCustomerId,
      stripeSubscriptionId: input.snapshot.subscriptionId,
      status: input.snapshot.status,
      stripePriceId: input.snapshot.item.priceId,
      currentPeriodEnd: input.snapshot.item.currentPeriodEnd,
      cancelAtPeriodEnd: input.snapshot.cancelAtPeriodEnd,
      providerCreatedAt: input.snapshot.providerCreatedAt,
      providerUpdatedAt: input.now,
    },
  })

  await tx.billingSubscriptionItem.deleteMany({
    where: {
      billingSubscriptionId: subscription.id,
      stripeSubscriptionItemId: { not: input.snapshot.item.subscriptionItemId },
    },
  })
  await tx.billingSubscriptionItem.upsert({
    where: { stripeSubscriptionItemId: input.snapshot.item.subscriptionItemId },
    create: {
      billingSubscriptionId: subscription.id,
      stripeSubscriptionItemId: input.snapshot.item.subscriptionItemId,
      stripePriceId: input.snapshot.item.priceId,
      quantity: input.snapshot.item.quantity,
    },
    update: {
      billingSubscriptionId: subscription.id,
      stripePriceId: input.snapshot.item.priceId,
      quantity: input.snapshot.item.quantity,
    },
  })
  await tx.billingEntitlement.upsert({
    where: { organizationId_key: { organizationId: input.organizationId, key: "core" } },
    create: {
      organizationId: input.organizationId,
      billingSubscriptionId: subscription.id,
      key: "core",
      active: input.entitlementActive,
    },
    update: {
      billingSubscriptionId: subscription.id,
      active: input.entitlementActive,
    },
  })
  await tx.auditEvent.create({
    data: {
      eventName: "billing.subscription.reconciled",
      actorType: "stripe",
      entityType: "billing_subscription",
      entityId: subscription.id,
      organizationId: input.organizationId,
      metadata: {
        stripe_subscription_id: input.snapshot.subscriptionId,
        status: input.snapshot.status,
      },
    },
  })
  await finalizeClaim(tx, input.claim, "processed", input.now)
  return "processed"
}

async function finalizeClaim(
  tx: Prisma.TransactionClient,
  claim: Extract<WebhookClaim, { kind: "claimed" }>,
  status: "processed" | "ignored",
  now: Date
) {
  const result = await tx.providerWebhookEvent.updateMany({
    where: { id: claim.ledgerId, status: "processing", attemptCount: claim.attemptCount },
    data: { status, processedAt: now, processingStartedAt: null },
  })
  if (result.count !== 1) throw new Error("Stripe webhook claim was superseded.")
}
