-- Prisma schema baseline. Generated from the accepted schema with `prisma migrate diff`.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'archived');
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'suspended');
CREATE TYPE "OrganizationRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');
CREATE TYPE "AuditActorType" AS ENUM ('user', 'system', 'clerk');
CREATE TYPE "WebhookProvider" AS ENUM ('clerk');
CREATE TYPE "ProviderWebhookStatus" AS ENUM ('received', 'processed', 'ignored', 'failed');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" VARCHAR(320),
    "displayName" VARCHAR(120),
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "selectedOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'viewer',
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" VARCHAR(500),
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "ProviderWebhookStatus" NOT NULL DEFAULT 'received',
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "safeMetadata" JSONB,
    CONSTRAINT "provider_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_selectedOrganizationId_idx" ON "users"("selectedOrganizationId");
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");
CREATE INDEX "organizations_updatedAt_idx" ON "organizations"("updatedAt");
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");
CREATE INDEX "memberships_userId_idx" ON "memberships"("userId");
CREATE INDEX "memberships_role_idx" ON "memberships"("role");
CREATE UNIQUE INDEX "memberships_organizationId_userId_key" ON "memberships"("organizationId", "userId");
CREATE INDEX "organization_invitations_invitedByUserId_idx" ON "organization_invitations"("invitedByUserId");
CREATE INDEX "organization_invitations_status_expiresAt_idx" ON "organization_invitations"("status", "expiresAt");
CREATE UNIQUE INDEX "organization_invitations_organizationId_email_status_key" ON "organization_invitations"("organizationId", "email", "status");
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
CREATE INDEX "projects_organizationId_idx" ON "projects"("organizationId");
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_updatedAt_idx" ON "projects"("updatedAt");
CREATE INDEX "audit_events_eventName_idx" ON "audit_events"("eventName");
CREATE INDEX "audit_events_actorType_idx" ON "audit_events"("actorType");
CREATE INDEX "audit_events_actorUserId_idx" ON "audit_events"("actorUserId");
CREATE INDEX "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");
CREATE INDEX "audit_events_organizationId_createdAt_idx" ON "audit_events"("organizationId", "createdAt");
CREATE INDEX "audit_events_projectId_createdAt_idx" ON "audit_events"("projectId", "createdAt");
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");
CREATE INDEX "provider_webhook_events_provider_idx" ON "provider_webhook_events"("provider");
CREATE INDEX "provider_webhook_events_providerEventId_idx" ON "provider_webhook_events"("providerEventId");
CREATE INDEX "provider_webhook_events_eventType_idx" ON "provider_webhook_events"("eventType");
CREATE INDEX "provider_webhook_events_status_idx" ON "provider_webhook_events"("status");
CREATE INDEX "provider_webhook_events_processed_idx" ON "provider_webhook_events"("processed");
CREATE INDEX "provider_webhook_events_receivedAt_idx" ON "provider_webhook_events"("receivedAt");
CREATE UNIQUE INDEX "provider_webhook_events_provider_providerEventId_key" ON "provider_webhook_events"("provider", "providerEventId");

ALTER TABLE "users" ADD CONSTRAINT "users_selectedOrganizationId_fkey" FOREIGN KEY ("selectedOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Restricted application role. Login credentials are provisioned outside migrations.
DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'vibes_runtime') THEN
    CREATE ROLE vibes_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  ELSE
    ALTER ROLE vibes_runtime WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$role$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

CREATE FUNCTION app_private.current_organization_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
PARALLEL SAFE
RETURN NULLIF(current_setting('app.current_organization_id', true), '');

REVOKE ALL ON FUNCTION app_private.current_organization_id() FROM PUBLIC;
GRANT USAGE ON SCHEMA public, app_private TO vibes_runtime;
GRANT EXECUTE ON FUNCTION app_private.current_organization_id() TO vibes_runtime;

GRANT SELECT, INSERT, UPDATE ON TABLE "users", "provider_webhook_events" TO vibes_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "organizations", "memberships", "organization_invitations", "projects" TO vibes_runtime;
GRANT SELECT, INSERT ON TABLE "audit_events" TO vibes_runtime;

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "organizations_select" ON "organizations" FOR SELECT TO vibes_runtime USING ("id" = app_private.current_organization_id());
CREATE POLICY "organizations_insert" ON "organizations" FOR INSERT TO vibes_runtime WITH CHECK ("id" = app_private.current_organization_id());
CREATE POLICY "organizations_update" ON "organizations" FOR UPDATE TO vibes_runtime USING ("id" = app_private.current_organization_id()) WITH CHECK ("id" = app_private.current_organization_id());
CREATE POLICY "organizations_delete" ON "organizations" FOR DELETE TO vibes_runtime USING ("id" = app_private.current_organization_id());

ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY "memberships_select" ON "memberships" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "memberships_insert" ON "memberships" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "memberships_update" ON "memberships" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "memberships_delete" ON "memberships" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "organization_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_invitations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "organization_invitations_select" ON "organization_invitations" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "organization_invitations_insert" ON "organization_invitations" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "organization_invitations_update" ON "organization_invitations" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "organization_invitations_delete" ON "organization_invitations" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON "projects" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "projects_insert" ON "projects" FOR INSERT TO vibes_runtime WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "projects_update" ON "projects" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "projects_delete" ON "projects" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());

ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "audit_events_select" ON "audit_events" FOR SELECT TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
CREATE POLICY "audit_events_insert" ON "audit_events" FOR INSERT TO vibes_runtime WITH CHECK (
  "organizationId" = app_private.current_organization_id()
  OR ("organizationId" IS NULL AND "actorType" IN ('clerk', 'system'))
);
CREATE POLICY "audit_events_update" ON "audit_events" FOR UPDATE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id()) WITH CHECK ("organizationId" = app_private.current_organization_id());
CREATE POLICY "audit_events_delete" ON "audit_events" FOR DELETE TO vibes_runtime USING ("organizationId" = app_private.current_organization_id());
