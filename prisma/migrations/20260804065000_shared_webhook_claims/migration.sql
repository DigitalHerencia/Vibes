ALTER TYPE "ProviderWebhookStatus" ADD VALUE 'processing' AFTER 'received';

DROP INDEX "provider_webhook_events_processed_idx";

ALTER TABLE "users" ADD COLUMN "identityProviderUpdatedAt" TIMESTAMP(3);

ALTER TABLE "provider_webhook_events"
  DROP COLUMN "processed",
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ALTER COLUMN "providerEventId" TYPE VARCHAR(255),
  ALTER COLUMN "eventType" TYPE VARCHAR(120),
  ALTER COLUMN "processingError" TYPE VARCHAR(500);

CREATE INDEX "provider_webhook_events_status_processingStartedAt_idx"
  ON "provider_webhook_events"("status", "processingStartedAt");
