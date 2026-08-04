ALTER TYPE "WebhookProvider" ADD VALUE 'stripe_connect';
CREATE TYPE "ConnectAccountStatus" AS ENUM ('pending', 'restricted', 'ready');
CREATE TYPE "ConnectPaymentStatus" AS ENUM ('checkout_pending', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'succeeded', 'canceled');
CREATE TYPE "ConnectRefundStatus" AS ENUM ('pending', 'requires_action', 'succeeded', 'failed', 'canceled');
CREATE TYPE "ConnectRecoveryOperation" AS ENUM ('onboarding', 'readiness', 'authorization', 'capture', 'cancel', 'refund', 'webhook');
CREATE TYPE "ConnectRecoveryOutcome" AS ENUM ('synchronized', 'recovery_required', 'ignored');

CREATE TABLE "connect_accounts" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stripeAccountId" VARCHAR(255) NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "status" "ConnectAccountStatus" NOT NULL DEFAULT 'pending',
  "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
  "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
  "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "requirementsDueCount" INTEGER NOT NULL DEFAULT 0,
  "disabledReason" VARCHAR(160),
  "providerUpdatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "connect_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_connect_account_bindings" (
  "id" TEXT NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_connect_account_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "connect_payments" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "connectAccountId" TEXT NOT NULL,
  "reference" VARCHAR(120) NOT NULL,
  "stripeCheckoutSessionId" VARCHAR(255),
  "stripePaymentIntentId" VARCHAR(255),
  "latestChargeId" VARCHAR(255),
  "amountMinor" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "platformFeeMinor" INTEGER NOT NULL,
  "status" "ConnectPaymentStatus" NOT NULL DEFAULT 'checkout_pending',
  "amountCapturableMinor" INTEGER NOT NULL DEFAULT 0,
  "amountReceivedMinor" INTEGER NOT NULL DEFAULT 0,
  "refundedAmountMinor" INTEGER NOT NULL DEFAULT 0,
  "providerUpdatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "connect_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "connect_payments_money_check" CHECK ("amountMinor" > 0 AND "platformFeeMinor" >= 0 AND "platformFeeMinor" < "amountMinor" AND "amountCapturableMinor" >= 0 AND "amountReceivedMinor" >= 0 AND "refundedAmountMinor" >= 0),
  CONSTRAINT "connect_payments_currency_check" CHECK ("currency" ~ '^[a-z]{3}$')
);

CREATE TABLE "connect_refunds" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "connectPaymentId" TEXT NOT NULL,
  "stripeRefundId" VARCHAR(255) NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "status" "ConnectRefundStatus" NOT NULL,
  "providerUpdatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "connect_refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "connect_refunds_amount_check" CHECK ("amountMinor" > 0)
);

CREATE TABLE "connect_recovery_snapshots" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "connectAccountId" TEXT,
  "connectPaymentId" TEXT,
  "operation" "ConnectRecoveryOperation" NOT NULL,
  "outcome" "ConnectRecoveryOutcome" NOT NULL,
  "providerObjectId" VARCHAR(255) NOT NULL,
  "providerStatus" VARCHAR(80) NOT NULL,
  "safeMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "connect_recovery_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_accounts_organizationId_key" ON "connect_accounts"("organizationId");
CREATE UNIQUE INDEX "connect_accounts_stripeAccountId_key" ON "connect_accounts"("stripeAccountId");
CREATE INDEX "connect_accounts_organizationId_idx" ON "connect_accounts"("organizationId");
CREATE INDEX "connect_accounts_status_idx" ON "connect_accounts"("status");
CREATE UNIQUE INDEX "provider_connect_account_bindings_providerAccountId_key" ON "provider_connect_account_bindings"("providerAccountId");
CREATE INDEX "provider_connect_account_bindings_organizationId_idx" ON "provider_connect_account_bindings"("organizationId");
CREATE UNIQUE INDEX "connect_payments_stripeCheckoutSessionId_key" ON "connect_payments"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "connect_payments_stripePaymentIntentId_key" ON "connect_payments"("stripePaymentIntentId");
CREATE UNIQUE INDEX "connect_payments_organizationId_reference_key" ON "connect_payments"("organizationId", "reference");
CREATE INDEX "connect_payments_organizationId_status_idx" ON "connect_payments"("organizationId", "status");
CREATE INDEX "connect_payments_connectAccountId_idx" ON "connect_payments"("connectAccountId");
CREATE UNIQUE INDEX "connect_refunds_stripeRefundId_key" ON "connect_refunds"("stripeRefundId");
CREATE INDEX "connect_refunds_organizationId_status_idx" ON "connect_refunds"("organizationId", "status");
CREATE INDEX "connect_refunds_connectPaymentId_idx" ON "connect_refunds"("connectPaymentId");
CREATE INDEX "connect_recovery_snapshots_organizationId_createdAt_idx" ON "connect_recovery_snapshots"("organizationId", "createdAt");
CREATE INDEX "connect_recovery_snapshots_connectAccountId_idx" ON "connect_recovery_snapshots"("connectAccountId");
CREATE INDEX "connect_recovery_snapshots_connectPaymentId_idx" ON "connect_recovery_snapshots"("connectPaymentId");

ALTER TABLE "connect_accounts" ADD CONSTRAINT "connect_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_connect_account_bindings" ADD CONSTRAINT "provider_connect_account_bindings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_payments" ADD CONSTRAINT "connect_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_payments" ADD CONSTRAINT "connect_payments_connectAccountId_fkey" FOREIGN KEY ("connectAccountId") REFERENCES "connect_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "connect_refunds" ADD CONSTRAINT "connect_refunds_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_refunds" ADD CONSTRAINT "connect_refunds_connectPaymentId_fkey" FOREIGN KEY ("connectPaymentId") REFERENCES "connect_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_recovery_snapshots" ADD CONSTRAINT "connect_recovery_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_recovery_snapshots" ADD CONSTRAINT "connect_recovery_snapshots_connectAccountId_fkey" FOREIGN KEY ("connectAccountId") REFERENCES "connect_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_recovery_snapshots" ADD CONSTRAINT "connect_recovery_snapshots_connectPaymentId_fkey" FOREIGN KEY ("connectPaymentId") REFERENCES "connect_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

GRANT SELECT, INSERT ON TABLE "provider_connect_account_bindings", "connect_recovery_snapshots" TO vibes_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "connect_accounts", "connect_payments", "connect_refunds" TO vibes_runtime;

ALTER TABLE "connect_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connect_accounts" FORCE ROW LEVEL SECURITY;
CREATE POLICY "connect_accounts_select" ON "connect_accounts" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_accounts_insert" ON "connect_accounts" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_accounts_update" ON "connect_accounts" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_accounts_delete" ON "connect_accounts" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "connect_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connect_payments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "connect_payments_select" ON "connect_payments" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_payments_insert" ON "connect_payments" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_payments_update" ON "connect_payments" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_payments_delete" ON "connect_payments" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "connect_refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connect_refunds" FORCE ROW LEVEL SECURITY;
CREATE POLICY "connect_refunds_select" ON "connect_refunds" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_refunds_insert" ON "connect_refunds" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_refunds_update" ON "connect_refunds" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_refunds_delete" ON "connect_refunds" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "connect_recovery_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connect_recovery_snapshots" FORCE ROW LEVEL SECURITY;
CREATE POLICY "connect_recovery_snapshots_select" ON "connect_recovery_snapshots" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "connect_recovery_snapshots_insert" ON "connect_recovery_snapshots" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
