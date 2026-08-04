import "server-only"

import { requireTenantContext } from "@/lib/auth/session"
import { assertCapability } from "@/lib/authz/assertions"
import { compareBillingState } from "@/lib/billing/billingState"
import { upsertBillingCustomerTx } from "@/lib/db/transactions/billingTransactions"
import { withTenantContext } from "@/lib/db/withTenantContext"
import { getOptionalEnv, getRequiredEnv } from "@/lib/env"
import { ExpectedActionError } from "@/lib/errors/expectedActionError"
import {
  stripeBillingProvider,
  type StripeBillingProvider,
} from "@/lib/integrations/stripe/billing"

type BillingWorkflowOptions = {
  provider?: StripeBillingProvider
  now?: Date
}

function applicationUrl(): URL {
  const raw = getOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"
  const url = new URL(raw)
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS outside local development.")
  }
  return url
}

function checkoutKey(organizationId: string, priceId: string, now: Date): string {
  return `checkout:${organizationId}:${priceId}:${now.toISOString().slice(0, 10)}`
}

function portalKey(organizationId: string, now: Date): string {
  return `portal:${organizationId}:${Math.floor(now.getTime() / 300_000)}`
}

async function requireBillingCustomer(
  provider: StripeBillingProvider,
  context: Awaited<ReturnType<typeof requireTenantContext>>
) {
  const existing = await withTenantContext(context.organization.id, (tx) =>
    tx.billingCustomer.findUnique({ where: { organizationId: context.organization.id } })
  )
  if (existing) return existing

  const organization = await withTenantContext(context.organization.id, (tx) =>
    tx.organization.findUniqueOrThrow({
      where: { id: context.organization.id },
      select: { name: true },
    })
  )
  const created = await provider.createCustomer({
    organizationId: context.organization.id,
    email: context.localUser.email,
    displayName: organization.name,
    idempotencyKey: `billing-customer:${context.organization.id}`,
  })
  return withTenantContext(context.organization.id, (tx) =>
    upsertBillingCustomerTx(tx, {
      organizationId: context.organization.id,
      stripeCustomerId: created.customerId,
    })
  )
}

export async function createCheckoutSessionWorkflow(options: BillingWorkflowOptions = {}) {
  const context = await requireTenantContext()
  assertCapability(context, "billing.manage")
  const provider = options.provider ?? stripeBillingProvider
  const now = options.now ?? new Date()
  const priceId = getRequiredEnv("STRIPE_RECURRING_PRICE_ID")
  const customer = await requireBillingCustomer(provider, context)
  const existing = await withTenantContext(context.organization.id, (tx) =>
    tx.billingSubscription.findUnique({
      where: { organizationId: context.organization.id },
      select: { status: true },
    })
  )
  if (existing && existing.status !== "canceled" && existing.status !== "incomplete_expired") {
    throw new ExpectedActionError(
      "BILLING_SUBSCRIPTION_EXISTS",
      "Manage the existing subscription in the billing portal."
    )
  }

  const appUrl = applicationUrl()
  const successUrl = new URL("/settings?checkout=complete", appUrl).toString()
  const cancelUrl = new URL("/settings?checkout=canceled", appUrl).toString()
  return provider.createCheckoutSession({
    organizationId: context.organization.id,
    customerId: customer.stripeCustomerId,
    priceId,
    successUrl,
    cancelUrl,
    idempotencyKey: checkoutKey(context.organization.id, priceId, now),
  })
}

export async function createBillingPortalSessionWorkflow(options: BillingWorkflowOptions = {}) {
  const context = await requireTenantContext()
  assertCapability(context, "billing.manage")
  const provider = options.provider ?? stripeBillingProvider
  const customer = await withTenantContext(context.organization.id, (tx) =>
    tx.billingCustomer.findUnique({ where: { organizationId: context.organization.id } })
  )
  if (!customer) {
    throw new ExpectedActionError(
      "BILLING_CUSTOMER_MISSING",
      "Start Checkout before opening the billing portal."
    )
  }

  return provider.createPortalSession({
    customerId: customer.stripeCustomerId,
    returnUrl: new URL("/settings", applicationUrl()).toString(),
    idempotencyKey: portalKey(context.organization.id, options.now ?? new Date()),
  })
}

export async function inspectBillingDriftWorkflow(options: BillingWorkflowOptions = {}) {
  const context = await requireTenantContext()
  assertCapability(context, "billing.manage")
  const provider = options.provider ?? stripeBillingProvider
  const local = await withTenantContext(context.organization.id, async (tx) => {
    const customer = await tx.billingCustomer.findUnique({
      where: { organizationId: context.organization.id },
      select: { stripeCustomerId: true },
    })
    const subscription = await tx.billingSubscription.findUnique({
      where: { organizationId: context.organization.id },
      select: {
        status: true,
        stripePriceId: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
      },
    })
    const entitlement = await tx.billingEntitlement.findUnique({
      where: { organizationId_key: { organizationId: context.organization.id, key: "core" } },
      select: { active: true },
    })
    return { customer, subscription, entitlement }
  })

  if (!local.customer) return compareBillingState(null, null)
  const providerSubscriptions = await provider.listSubscriptions(local.customer.stripeCustomerId)
  const currentProvider =
    [...providerSubscriptions].sort(
      (left, right) => right.providerCreatedAt.getTime() - left.providerCreatedAt.getTime()
    )[0] ?? null
  const localSnapshot = local.subscription
    ? { ...local.subscription, entitlementActive: local.entitlement?.active ?? false }
    : null
  return compareBillingState(localSnapshot, currentProvider)
}
