import "server-only"

import { requireTenantContext } from "@/lib/auth/session"
import { assertCapability } from "@/lib/authz/assertions"
import {
  connectApplicationUrl,
  connectCountry,
  deriveConnectPaymentTerms,
} from "@/lib/connect/policy"
import { connectAccountStatus } from "@/lib/connect/status"
import {
  applyConnectAccountSnapshotTx,
  applyConnectPaymentSnapshotTx,
  applyConnectRefundSnapshotTx,
  attachConnectCheckoutSessionTx,
  prepareConnectPaymentTx,
} from "@/lib/db/transactions/connectTransactions"
import { withTenantContext } from "@/lib/db/withTenantContext"
import {
  stripeConnectProvider,
  type StripeConnectProvider,
} from "@/lib/integrations/stripe/connect"
import { ExpectedActionError } from "@/lib/errors/expectedActionError"

type ConnectWorkflowOptions = {
  provider?: StripeConnectProvider
  now?: Date
}

async function requireManagedConnectAccount(
  provider: StripeConnectProvider,
  now: Date,
  requireReady: boolean
) {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  let account = await withTenantContext(context.organization.id, (tx) =>
    tx.connectAccount.findUnique({ where: { organizationId: context.organization.id } })
  )
  if (!account) {
    const snapshot = await provider.createAccount({
      organizationId: context.organization.id,
      country: connectCountry(),
      email: context.localUser.email,
      idempotencyKey: `connect:account:${context.organization.id}`,
    })
    account = await withTenantContext(context.organization.id, (tx) =>
      applyConnectAccountSnapshotTx(tx, {
        organizationId: context.organization.id,
        snapshot,
        status: connectAccountStatus(snapshot),
        operation: "onboarding",
        now,
      })
    )
  }
  if (requireReady && account.status !== "ready") {
    throw new ExpectedActionError(
      "CONNECT_ACCOUNT_NOT_READY",
      "Complete connected-account onboarding before accepting payments."
    )
  }
  return { context, account }
}

export async function createConnectOnboardingLinkWorkflow(options: ConnectWorkflowOptions = {}) {
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const { context, account } = await requireManagedConnectAccount(provider, now, false)
  const appUrl = connectApplicationUrl()
  return provider.createAccountLink({
    accountId: account.stripeAccountId,
    refreshUrl: new URL("/settings?connect=refresh", appUrl).toString(),
    returnUrl: new URL("/settings?connect=return", appUrl).toString(),
    idempotencyKey: `connect:onboarding:${context.organization.id}:${now.getTime()}`,
  })
}

export async function createConnectCheckoutWorkflow(
  trustedInput: { reference: string; amountMinor: number },
  options: ConnectWorkflowOptions = {}
) {
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const terms = deriveConnectPaymentTerms(trustedInput)
  const { context, account } = await requireManagedConnectAccount(provider, now, true)
  const payment = await withTenantContext(
    context.organization.id,
    (tx) =>
      prepareConnectPaymentTx(tx, {
        organizationId: context.organization.id,
        connectAccountId: account.id,
        ...terms,
        now,
      }),
    { isolationLevel: "Serializable" }
  )
  const appUrl = connectApplicationUrl()
  const hosted = await provider.createCheckoutSession({
    connectPaymentId: payment.id,
    reference: payment.reference,
    connectedAccountId: account.stripeAccountId,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    platformFeeMinor: payment.platformFeeMinor,
    customerEmail: context.localUser.email,
    successUrl: new URL(`/settings?connect_payment=${payment.id}`, appUrl).toString(),
    cancelUrl: new URL("/settings?connect_payment=canceled", appUrl).toString(),
    idempotencyKey: `connect:checkout:${payment.id}`,
  })
  await withTenantContext(context.organization.id, (tx) =>
    attachConnectCheckoutSessionTx(tx, { paymentId: payment.id, sessionId: hosted.sessionId, now })
  )
  return { paymentId: payment.id, url: hosted.url }
}

export async function captureConnectPaymentWorkflow(
  paymentId: string,
  options: ConnectWorkflowOptions = {}
) {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const payment = await loadManagedPayment(context.organization.id, paymentId)
  if (!payment.stripePaymentIntentId) {
    throw new ExpectedActionError(
      "CONNECT_AUTHORIZATION_MISSING",
      "Payment authorization is not available."
    )
  }
  const snapshot = await provider.capturePaymentIntent(
    payment.stripePaymentIntentId,
    payment.connectAccount.stripeAccountId,
    `connect:capture:${payment.id}`
  )
  return withTenantContext(context.organization.id, (tx) =>
    applyConnectPaymentSnapshotTx(tx, {
      organizationId: context.organization.id,
      paymentId: payment.id,
      snapshot,
      operation: "capture",
      now,
    })
  )
}

export async function cancelConnectPaymentWorkflow(
  paymentId: string,
  options: ConnectWorkflowOptions = {}
) {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const payment = await loadManagedPayment(context.organization.id, paymentId)
  if (!payment.stripePaymentIntentId) {
    throw new ExpectedActionError(
      "CONNECT_AUTHORIZATION_MISSING",
      "Payment authorization is not available."
    )
  }
  const snapshot = await provider.cancelPaymentIntent(
    payment.stripePaymentIntentId,
    payment.connectAccount.stripeAccountId,
    `connect:cancel:${payment.id}`
  )
  return withTenantContext(context.organization.id, (tx) =>
    applyConnectPaymentSnapshotTx(tx, {
      organizationId: context.organization.id,
      paymentId: payment.id,
      snapshot,
      operation: "cancel",
      now,
    })
  )
}

export async function refundConnectPaymentWorkflow(
  paymentId: string,
  options: ConnectWorkflowOptions = {}
) {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const payment = await loadManagedPayment(context.organization.id, paymentId)
  if (!payment.stripePaymentIntentId || !payment.latestChargeId) {
    throw new ExpectedActionError(
      "CONNECT_CAPTURE_MISSING",
      "Captured payment is not available for refund."
    )
  }
  const snapshot = await provider.createFullRefund({
    chargeId: payment.latestChargeId,
    paymentIntentId: payment.stripePaymentIntentId,
    connectedAccountId: payment.connectAccount.stripeAccountId,
    idempotencyKey: `connect:refund:${payment.id}:full`,
  })
  return withTenantContext(context.organization.id, (tx) =>
    applyConnectRefundSnapshotTx(tx, {
      organizationId: context.organization.id,
      paymentId: payment.id,
      snapshot,
      operation: "refund",
      now,
    })
  )
}

export async function recoverConnectPaymentWorkflow(
  paymentId: string,
  options: ConnectWorkflowOptions = {}
) {
  const context = await requireTenantContext()
  assertCapability(context, "connect.manage")
  const provider = options.provider ?? stripeConnectProvider
  const now = options.now ?? new Date()
  const payment = await loadManagedPayment(context.organization.id, paymentId)
  if (!payment.stripePaymentIntentId) {
    throw new ExpectedActionError(
      "CONNECT_AUTHORIZATION_MISSING",
      "Payment authorization is not available."
    )
  }
  const snapshot = await provider.retrievePaymentIntent(
    payment.stripePaymentIntentId,
    payment.connectAccount.stripeAccountId
  )
  return withTenantContext(context.organization.id, (tx) =>
    applyConnectPaymentSnapshotTx(tx, {
      organizationId: context.organization.id,
      paymentId: payment.id,
      snapshot,
      operation: "webhook",
      now,
    })
  )
}

async function loadManagedPayment(organizationId: string, paymentId: string) {
  return withTenantContext(organizationId, (tx) =>
    tx.connectPayment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { connectAccount: { select: { stripeAccountId: true } } },
    })
  )
}
