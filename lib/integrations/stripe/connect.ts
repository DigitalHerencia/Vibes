import "server-only"

import type Stripe from "stripe"

import { getStripe } from "@/lib/integrations/stripe/client"
import { mapConnectPaymentStatus, mapConnectRefundStatus } from "@/lib/connect/status"
import {
  connectAccountSnapshotSchema,
  connectCheckoutSnapshotSchema,
  connectPaymentSnapshotSchema,
  connectRefundSnapshotSchema,
} from "@/schemas/connectSchemas"
import type {
  ConnectAccountSnapshot,
  ConnectPaymentSnapshot,
  ConnectRefundSnapshot,
} from "@/types/connectTypes"

export type StripeConnectProvider = {
  createAccount(input: {
    organizationId: string
    country: string
    email: string | null
    idempotencyKey: string
  }): Promise<ConnectAccountSnapshot>
  retrieveAccount(accountId: string): Promise<ConnectAccountSnapshot>
  createAccountLink(input: {
    accountId: string
    refreshUrl: string
    returnUrl: string
    idempotencyKey: string
  }): Promise<{ url: string }>
  createCheckoutSession(input: {
    connectPaymentId: string
    reference: string
    connectedAccountId: string
    amountMinor: number
    currency: string
    platformFeeMinor: number
    customerEmail: string | null
    successUrl: string
    cancelUrl: string
    idempotencyKey: string
  }): Promise<{ sessionId: string; url: string }>
  retrieveCheckoutPaymentIntent(sessionId: string): Promise<string | null>
  retrievePaymentIntent(
    paymentIntentId: string,
    connectedAccountId: string
  ): Promise<ConnectPaymentSnapshot>
  retrieveWebhookPaymentIntent(paymentIntentId: string): Promise<ConnectPaymentSnapshot>
  capturePaymentIntent(
    paymentIntentId: string,
    connectedAccountId: string,
    idempotencyKey: string
  ): Promise<ConnectPaymentSnapshot>
  cancelPaymentIntent(
    paymentIntentId: string,
    connectedAccountId: string,
    idempotencyKey: string
  ): Promise<ConnectPaymentSnapshot>
  createFullRefund(input: {
    chargeId: string
    paymentIntentId: string
    connectedAccountId: string
    idempotencyKey: string
  }): Promise<ConnectRefundSnapshot>
  retrieveRefund(refundId: string, paymentIntentId: string): Promise<ConnectRefundSnapshot>
}

function requiredUrl(value: string | null): string {
  if (!value) throw new Error("Stripe did not return a hosted URL.")
  return value
}

function assertConnectScope(snapshot: ConnectPaymentSnapshot, expectedAccountId: string) {
  if (snapshot.connectedAccountId !== expectedAccountId) {
    throw new Error("Stripe PaymentIntent connected-account scope mismatch.")
  }
}

export const stripeConnectProvider: StripeConnectProvider = {
  async createAccount(input) {
    const account = await getStripe().accounts.create(
      {
        type: "express",
        country: input.country,
        ...(input.email ? { email: input.email } : {}),
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { organization_id: input.organizationId },
      },
      { idempotencyKey: input.idempotencyKey }
    )
    return mapConnectAccountSnapshot(account)
  },

  async retrieveAccount(accountId) {
    return mapConnectAccountSnapshot(await getStripe().accounts.retrieve(accountId))
  },

  async createAccountLink(input) {
    const link = await getStripe().accountLinks.create(
      {
        account: input.accountId,
        refresh_url: input.refreshUrl,
        return_url: input.returnUrl,
        type: "account_onboarding",
      },
      { idempotencyKey: input.idempotencyKey }
    )
    return { url: link.url }
  },

  async createCheckoutSession(input) {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: input.connectPaymentId,
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency,
              unit_amount: input.amountMinor,
              product_data: { name: "Marketplace payment" },
            },
          },
        ],
        payment_intent_data: {
          capture_method: "manual",
          ...(input.platformFeeMinor > 0 ? { application_fee_amount: input.platformFeeMinor } : {}),
          on_behalf_of: input.connectedAccountId,
          transfer_data: { destination: input.connectedAccountId },
          metadata: {
            connect_payment_id: input.connectPaymentId,
            reference: input.reference,
          },
        },
        metadata: { connect_payment_id: input.connectPaymentId },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
      { idempotencyKey: input.idempotencyKey }
    )
    return { sessionId: session.id, url: requiredUrl(session.url) }
  },

  async retrieveCheckoutPaymentIntent(sessionId) {
    const session = mapConnectCheckoutSnapshot(
      await getStripe().checkout.sessions.retrieve(sessionId)
    )
    return session.paymentIntentId
  },

  async retrievePaymentIntent(paymentIntentId, connectedAccountId) {
    const snapshot = await this.retrieveWebhookPaymentIntent(paymentIntentId)
    assertConnectScope(snapshot, connectedAccountId)
    return snapshot
  },

  async retrieveWebhookPaymentIntent(paymentIntentId) {
    return mapConnectPaymentSnapshot(await getStripe().paymentIntents.retrieve(paymentIntentId))
  },

  async capturePaymentIntent(paymentIntentId, connectedAccountId, idempotencyKey) {
    const current = await this.retrievePaymentIntent(paymentIntentId, connectedAccountId)
    if (current.status !== "requires_capture") return current
    const snapshot = mapConnectPaymentSnapshot(
      await getStripe().paymentIntents.capture(paymentIntentId, {}, { idempotencyKey })
    )
    assertConnectScope(snapshot, connectedAccountId)
    return snapshot
  },

  async cancelPaymentIntent(paymentIntentId, connectedAccountId, idempotencyKey) {
    const current = await this.retrievePaymentIntent(paymentIntentId, connectedAccountId)
    if (current.status === "canceled" || current.status === "succeeded") return current
    const snapshot = mapConnectPaymentSnapshot(
      await getStripe().paymentIntents.cancel(paymentIntentId, {}, { idempotencyKey })
    )
    assertConnectScope(snapshot, connectedAccountId)
    return snapshot
  },

  async createFullRefund(input) {
    const current = await this.retrievePaymentIntent(
      input.paymentIntentId,
      input.connectedAccountId
    )
    if (current.latestChargeId !== input.chargeId || current.status !== "succeeded") {
      throw new Error("Current Stripe state does not permit a refund.")
    }
    return mapConnectRefundSnapshot(
      await getStripe().refunds.create(
        {
          charge: input.chargeId,
          reverse_transfer: true,
          refund_application_fee: true,
          metadata: { payment_intent_id: input.paymentIntentId },
        },
        { idempotencyKey: input.idempotencyKey }
      )
    )
  },

  async retrieveRefund(refundId, paymentIntentId) {
    const snapshot = mapConnectRefundSnapshot(await getStripe().refunds.retrieve(refundId))
    if (snapshot.paymentIntentId !== paymentIntentId) {
      throw new Error("Stripe refund PaymentIntent scope mismatch.")
    }
    return snapshot
  },
}

export function mapConnectAccountSnapshot(value: unknown): ConnectAccountSnapshot {
  const parsed = connectAccountSnapshotSchema.parse(value)
  return {
    accountId: parsed.id,
    country: parsed.country.toUpperCase(),
    detailsSubmitted: parsed.details_submitted,
    chargesEnabled: parsed.charges_enabled,
    payoutsEnabled: parsed.payouts_enabled,
    requirementsDueCount: parsed.requirements?.currently_due?.length ?? 0,
    disabledReason: parsed.requirements?.disabled_reason?.slice(0, 160) ?? null,
  }
}

export function mapConnectPaymentSnapshot(value: unknown): ConnectPaymentSnapshot {
  const parsed = connectPaymentSnapshotSchema.parse(value)
  return {
    connectPaymentId: parsed.metadata.connect_payment_id,
    paymentIntentId: parsed.id,
    connectedAccountId: parsed.transfer_data.destination,
    status: mapConnectPaymentStatus(parsed.status),
    amountMinor: parsed.amount,
    currency: parsed.currency,
    platformFeeMinor: parsed.application_fee_amount ?? 0,
    amountCapturableMinor: parsed.amount_capturable,
    amountReceivedMinor: parsed.amount_received,
    latestChargeId: parsed.latest_charge,
  }
}

export function mapConnectRefundSnapshot(value: unknown): ConnectRefundSnapshot {
  const parsed = connectRefundSnapshotSchema.parse(value)
  return {
    refundId: parsed.id,
    paymentIntentId: parsed.payment_intent,
    amountMinor: parsed.amount,
    status: mapConnectRefundStatus(parsed.status),
  }
}

export function mapConnectCheckoutSnapshot(value: unknown): {
  sessionId: string
  paymentIntentId: string | null
  connectPaymentId: string | null
} {
  const parsed = connectCheckoutSnapshotSchema.parse(value)
  return {
    sessionId: parsed.id,
    paymentIntentId: parsed.payment_intent,
    connectPaymentId: parsed.metadata?.connect_payment_id ?? null,
  }
}

export function constructConnectWebhookEvent(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret)
}
