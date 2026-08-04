import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

import type { WebhookClaim } from "@/lib/db/transactions/webhookTransactions"
import type {
  ConnectAccountSnapshot,
  ConnectPaymentSnapshot,
  ConnectRefundSnapshot,
} from "@/types/connectTypes"

type RecoveryOperation =
  | "onboarding"
  | "readiness"
  | "authorization"
  | "capture"
  | "cancel"
  | "refund"
  | "webhook"

export async function applyConnectAccountSnapshotTx(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    snapshot: ConnectAccountSnapshot
    status: "pending" | "restricted" | "ready"
    operation: RecoveryOperation
    now: Date
  }
) {
  const existing = await tx.connectAccount.findUnique({
    where: { organizationId: input.organizationId },
    select: { stripeAccountId: true },
  })
  if (existing && existing.stripeAccountId !== input.snapshot.accountId) {
    throw new Error("Organization is already bound to another Stripe connected account.")
  }

  const account = await tx.connectAccount.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      stripeAccountId: input.snapshot.accountId,
      country: input.snapshot.country,
      status: input.status,
      detailsSubmitted: input.snapshot.detailsSubmitted,
      chargesEnabled: input.snapshot.chargesEnabled,
      payoutsEnabled: input.snapshot.payoutsEnabled,
      requirementsDueCount: input.snapshot.requirementsDueCount,
      disabledReason: input.snapshot.disabledReason,
      providerUpdatedAt: input.now,
    },
    update: {
      country: input.snapshot.country,
      status: input.status,
      detailsSubmitted: input.snapshot.detailsSubmitted,
      chargesEnabled: input.snapshot.chargesEnabled,
      payoutsEnabled: input.snapshot.payoutsEnabled,
      requirementsDueCount: input.snapshot.requirementsDueCount,
      disabledReason: input.snapshot.disabledReason,
      providerUpdatedAt: input.now,
    },
  })
  await tx.providerConnectAccountBinding.createMany({
    data: [
      {
        providerAccountId: input.snapshot.accountId,
        organizationId: input.organizationId,
      },
    ],
    skipDuplicates: true,
  })
  const binding = await tx.providerConnectAccountBinding.findUniqueOrThrow({
    where: { providerAccountId: input.snapshot.accountId },
    select: { organizationId: true },
  })
  if (binding.organizationId !== input.organizationId) {
    throw new Error("Stripe connected account is already bound to another organization.")
  }
  await writeRecoverySnapshot(tx, {
    organizationId: input.organizationId,
    connectAccountId: account.id,
    operation: input.operation,
    outcome: "synchronized",
    providerObjectId: input.snapshot.accountId,
    providerStatus: account.status,
    safeMetadata: {
      charges_enabled: input.snapshot.chargesEnabled,
      payouts_enabled: input.snapshot.payoutsEnabled,
      requirements_due_count: input.snapshot.requirementsDueCount,
    },
  })
  await tx.auditEvent.create({
    data: {
      eventName: "connect.account.reconciled",
      actorType: "stripe",
      entityType: "connect_account",
      entityId: account.id,
      organizationId: input.organizationId,
      metadata: { status: account.status, operation: input.operation },
    },
  })
  return account
}

export async function prepareConnectPaymentTx(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    connectAccountId: string
    reference: string
    amountMinor: number
    currency: string
    platformFeeMinor: number
    now: Date
  }
) {
  const existing = await tx.connectPayment.findUnique({
    where: {
      organizationId_reference: {
        organizationId: input.organizationId,
        reference: input.reference,
      },
    },
  })
  if (existing) {
    if (
      existing.connectAccountId !== input.connectAccountId ||
      existing.amountMinor !== input.amountMinor ||
      existing.currency !== input.currency ||
      existing.platformFeeMinor !== input.platformFeeMinor
    ) {
      throw new Error("Payment reference was reused with different immutable terms.")
    }
    return existing
  }
  return tx.connectPayment.create({
    data: {
      organizationId: input.organizationId,
      connectAccountId: input.connectAccountId,
      reference: input.reference,
      amountMinor: input.amountMinor,
      currency: input.currency,
      platformFeeMinor: input.platformFeeMinor,
      providerUpdatedAt: input.now,
    },
  })
}

export async function attachConnectCheckoutSessionTx(
  tx: Prisma.TransactionClient,
  input: { paymentId: string; sessionId: string; now: Date }
) {
  const payment = await tx.connectPayment.findUniqueOrThrow({ where: { id: input.paymentId } })
  if (payment.stripeCheckoutSessionId && payment.stripeCheckoutSessionId !== input.sessionId) {
    throw new Error("Payment is already bound to another Stripe Checkout Session.")
  }
  return tx.connectPayment.update({
    where: { id: input.paymentId },
    data: { stripeCheckoutSessionId: input.sessionId, providerUpdatedAt: input.now },
  })
}

export async function applyConnectPaymentSnapshotTx(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    paymentId: string
    snapshot: ConnectPaymentSnapshot
    operation: RecoveryOperation
    now: Date
  }
) {
  const payment = await tx.connectPayment.findUniqueOrThrow({
    where: { id: input.paymentId },
    include: { connectAccount: { select: { stripeAccountId: true } } },
  })
  if (payment.organizationId !== input.organizationId) throw new Error("Payment tenant mismatch.")
  if (input.snapshot.connectPaymentId !== payment.id)
    throw new Error("Stripe payment metadata mismatch.")
  if (input.snapshot.connectedAccountId !== payment.connectAccount.stripeAccountId) {
    throw new Error("Stripe connected-account scope mismatch.")
  }
  if (
    input.snapshot.amountMinor !== payment.amountMinor ||
    input.snapshot.currency !== payment.currency ||
    input.snapshot.platformFeeMinor !== payment.platformFeeMinor
  ) {
    throw new Error("Stripe payment terms differ from the server-owned payment terms.")
  }
  if (
    payment.stripePaymentIntentId &&
    payment.stripePaymentIntentId !== input.snapshot.paymentIntentId
  ) {
    throw new Error("Payment is already bound to another Stripe PaymentIntent.")
  }

  const updated = await tx.connectPayment.update({
    where: { id: payment.id },
    data: {
      stripePaymentIntentId: input.snapshot.paymentIntentId,
      latestChargeId: input.snapshot.latestChargeId,
      status: input.snapshot.status,
      amountCapturableMinor: input.snapshot.amountCapturableMinor,
      amountReceivedMinor: input.snapshot.amountReceivedMinor,
      providerUpdatedAt: input.now,
    },
  })
  await writeRecoverySnapshot(tx, {
    organizationId: input.organizationId,
    connectPaymentId: payment.id,
    connectAccountId: payment.connectAccountId,
    operation: input.operation,
    outcome: "synchronized",
    providerObjectId: input.snapshot.paymentIntentId,
    providerStatus: input.snapshot.status,
    safeMetadata: {
      amount_capturable_minor: input.snapshot.amountCapturableMinor,
      amount_received_minor: input.snapshot.amountReceivedMinor,
    },
  })
  await tx.auditEvent.create({
    data: {
      eventName: "connect.payment.reconciled",
      actorType: "stripe",
      entityType: "connect_payment",
      entityId: payment.id,
      organizationId: input.organizationId,
      metadata: { status: input.snapshot.status, operation: input.operation },
    },
  })
  return updated
}

export async function applyConnectRefundSnapshotTx(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    paymentId: string
    snapshot: ConnectRefundSnapshot
    operation: RecoveryOperation
    now: Date
  }
) {
  const payment = await tx.connectPayment.findUniqueOrThrow({ where: { id: input.paymentId } })
  if (payment.organizationId !== input.organizationId) throw new Error("Refund tenant mismatch.")
  if (payment.stripePaymentIntentId !== input.snapshot.paymentIntentId) {
    throw new Error("Stripe refund PaymentIntent mismatch.")
  }
  if (input.snapshot.amountMinor > payment.amountReceivedMinor) {
    throw new Error("Stripe refund exceeds captured funds.")
  }
  await tx.connectRefund.upsert({
    where: { stripeRefundId: input.snapshot.refundId },
    create: {
      organizationId: input.organizationId,
      connectPaymentId: payment.id,
      stripeRefundId: input.snapshot.refundId,
      amountMinor: input.snapshot.amountMinor,
      status: input.snapshot.status,
      providerUpdatedAt: input.now,
    },
    update: { status: input.snapshot.status, providerUpdatedAt: input.now },
  })
  const aggregate = await tx.connectRefund.aggregate({
    where: { connectPaymentId: payment.id, status: "succeeded" },
    _sum: { amountMinor: true },
  })
  const refundedAmountMinor = aggregate._sum.amountMinor ?? 0
  if (refundedAmountMinor > payment.amountReceivedMinor) {
    throw new Error("Successful refunds exceed captured funds.")
  }
  const updated = await tx.connectPayment.update({
    where: { id: payment.id },
    data: { refundedAmountMinor, providerUpdatedAt: input.now },
  })
  await writeRecoverySnapshot(tx, {
    organizationId: input.organizationId,
    connectPaymentId: payment.id,
    connectAccountId: payment.connectAccountId,
    operation: input.operation,
    outcome: "synchronized",
    providerObjectId: input.snapshot.refundId,
    providerStatus: input.snapshot.status,
    safeMetadata: { amount_minor: input.snapshot.amountMinor },
  })
  await tx.auditEvent.create({
    data: {
      eventName: "connect.refund.reconciled",
      actorType: "stripe",
      entityType: "connect_payment",
      entityId: payment.id,
      organizationId: input.organizationId,
      metadata: {
        status: input.snapshot.status,
        amount_minor: input.snapshot.amountMinor,
        operation: input.operation,
      },
    },
  })
  return updated
}

export async function finalizeConnectWebhookTx(
  tx: Prisma.TransactionClient,
  claim: Extract<WebhookClaim, { kind: "claimed" }>,
  status: "processed" | "ignored",
  now: Date
) {
  const result = await tx.providerWebhookEvent.updateMany({
    where: { id: claim.ledgerId, status: "processing", attemptCount: claim.attemptCount },
    data: { status, processedAt: now, processingStartedAt: null },
  })
  if (result.count !== 1) throw new Error("Connect webhook claim was superseded.")
}

async function writeRecoverySnapshot(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    connectAccountId?: string
    connectPaymentId?: string
    operation: RecoveryOperation
    outcome: "synchronized" | "recovery_required" | "ignored"
    providerObjectId: string
    providerStatus: string
    safeMetadata?: Prisma.InputJsonValue
  }
) {
  await tx.connectRecoverySnapshot.create({ data: input })
}
