ALTER TYPE "WebhookProvider" ADD VALUE 'stripe';
ALTER TYPE "AuditActorType" ADD VALUE 'stripe';

CREATE TYPE "BillingSubscriptionStatus" AS ENUM (
  'trialing',
  'active',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

CREATE TABLE "billing_customers" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stripeCustomerId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_customer_bindings" (
  "id" TEXT NOT NULL,
  "provider" "WebhookProvider" NOT NULL,
  "providerCustomerId" VARCHAR(255) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_customer_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_subscriptions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "billingCustomerId" TEXT NOT NULL,
  "stripeSubscriptionId" VARCHAR(255) NOT NULL,
  "status" "BillingSubscriptionStatus" NOT NULL,
  "stripePriceId" VARCHAR(255) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "providerCreatedAt" TIMESTAMP(3) NOT NULL,
  "providerUpdatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_subscription_items" (
  "id" TEXT NOT NULL,
  "billingSubscriptionId" TEXT NOT NULL,
  "stripeSubscriptionItemId" VARCHAR(255) NOT NULL,
  "stripePriceId" VARCHAR(255) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_subscription_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_entitlements" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "billingSubscriptionId" TEXT,
  "key" VARCHAR(80) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_customers_organizationId_key" ON "billing_customers"("organizationId");
CREATE UNIQUE INDEX "billing_customers_stripeCustomerId_key" ON "billing_customers"("stripeCustomerId");
CREATE INDEX "billing_customers_organizationId_idx" ON "billing_customers"("organizationId");
CREATE UNIQUE INDEX "provider_customer_bindings_provider_providerCustomerId_key" ON "provider_customer_bindings"("provider", "providerCustomerId");
CREATE INDEX "provider_customer_bindings_organizationId_idx" ON "provider_customer_bindings"("organizationId");
CREATE UNIQUE INDEX "billing_subscriptions_organizationId_key" ON "billing_subscriptions"("organizationId");
CREATE UNIQUE INDEX "billing_subscriptions_billingCustomerId_key" ON "billing_subscriptions"("billingCustomerId");
CREATE UNIQUE INDEX "billing_subscriptions_stripeSubscriptionId_key" ON "billing_subscriptions"("stripeSubscriptionId");
CREATE INDEX "billing_subscriptions_organizationId_idx" ON "billing_subscriptions"("organizationId");
CREATE INDEX "billing_subscriptions_status_idx" ON "billing_subscriptions"("status");
CREATE UNIQUE INDEX "billing_subscription_items_stripeSubscriptionItemId_key" ON "billing_subscription_items"("stripeSubscriptionItemId");
CREATE INDEX "billing_subscription_items_billingSubscriptionId_idx" ON "billing_subscription_items"("billingSubscriptionId");
CREATE UNIQUE INDEX "billing_entitlements_organizationId_key_key" ON "billing_entitlements"("organizationId", "key");
CREATE INDEX "billing_entitlements_organizationId_active_idx" ON "billing_entitlements"("organizationId", "active");
CREATE INDEX "billing_entitlements_billingSubscriptionId_idx" ON "billing_entitlements"("billingSubscriptionId");

ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_customer_bindings" ADD CONSTRAINT "provider_customer_bindings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billingCustomerId_fkey" FOREIGN KEY ("billingCustomerId") REFERENCES "billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_subscription_items" ADD CONSTRAINT "billing_subscription_items_billingSubscriptionId_fkey" FOREIGN KEY ("billingSubscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_entitlements" ADD CONSTRAINT "billing_entitlements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_entitlements" ADD CONSTRAINT "billing_entitlements_billingSubscriptionId_fkey" FOREIGN KEY ("billingSubscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

GRANT SELECT, INSERT ON TABLE "provider_customer_bindings" TO vibes_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "billing_customers", "billing_subscriptions", "billing_subscription_items", "billing_entitlements" TO vibes_runtime;

ALTER TABLE "billing_customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_customers" FORCE ROW LEVEL SECURITY;
CREATE POLICY "billing_customers_select" ON "billing_customers" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_customers_insert" ON "billing_customers" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_customers_update" ON "billing_customers" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_customers_delete" ON "billing_customers" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "billing_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_subscriptions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "billing_subscriptions_select" ON "billing_subscriptions" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_subscriptions_insert" ON "billing_subscriptions" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_subscriptions_update" ON "billing_subscriptions" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_subscriptions_delete" ON "billing_subscriptions" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "billing_subscription_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_subscription_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY "billing_subscription_items_select" ON "billing_subscription_items" FOR SELECT TO vibes_runtime USING (EXISTS (SELECT 1 FROM "billing_subscriptions" s WHERE s."id" = "billingSubscriptionId" AND s."organizationId" = app_private.current_organization_id()));
CREATE POLICY "billing_subscription_items_insert" ON "billing_subscription_items" FOR INSERT TO vibes_runtime WITH CHECK (EXISTS (SELECT 1 FROM "billing_subscriptions" s WHERE s."id" = "billingSubscriptionId" AND s."organizationId" = app_private.current_organization_id()));
CREATE POLICY "billing_subscription_items_update" ON "billing_subscription_items" FOR UPDATE TO vibes_runtime USING (EXISTS (SELECT 1 FROM "billing_subscriptions" s WHERE s."id" = "billingSubscriptionId" AND s."organizationId" = app_private.current_organization_id())) WITH CHECK (EXISTS (SELECT 1 FROM "billing_subscriptions" s WHERE s."id" = "billingSubscriptionId" AND s."organizationId" = app_private.current_organization_id()));
CREATE POLICY "billing_subscription_items_delete" ON "billing_subscription_items" FOR DELETE TO vibes_runtime USING (EXISTS (SELECT 1 FROM "billing_subscriptions" s WHERE s."id" = "billingSubscriptionId" AND s."organizationId" = app_private.current_organization_id()));

ALTER TABLE "billing_entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_entitlements" FORCE ROW LEVEL SECURITY;
CREATE POLICY "billing_entitlements_select" ON "billing_entitlements" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_entitlements_insert" ON "billing_entitlements" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_entitlements_update" ON "billing_entitlements" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "billing_entitlements_delete" ON "billing_entitlements" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
