import {
  canManageMembership,
  canReadProject,
  canTransitionProjectStatus,
  canUpdateProject,
} from "@/lib/authz/policies"
import type { Capability, OrganizationRole, TenantContext } from "@/types/authzTypes"
import { hasCapability } from "@/lib/authz/capabilities"

export function assertCapability(context: TenantContext, capability: Capability): void {
  if (!hasCapability(context.membership.role, capability)) {
    throw new Error("Capability denied.")
  }
}

type ProjectAccessRecord = {
  organizationId: string
  status: "active" | "archived"
}

export function assertCanReadProject(context: TenantContext, project: ProjectAccessRecord): void {
  if (!canReadProject(context, project)) throw new Error("Project access denied.")
}

export function assertCanUpdateProject(context: TenantContext, project: ProjectAccessRecord): void {
  if (!canUpdateProject(context, project)) throw new Error("Project update denied.")
}

export function assertCanTransitionProjectStatus(
  context: TenantContext,
  project: ProjectAccessRecord,
  nextStatus: ProjectAccessRecord["status"]
): void {
  if (!canTransitionProjectStatus(context, project, nextStatus)) {
    throw new Error("Project status transition denied.")
  }
}

export function assertCanManageMembership(
  context: TenantContext,
  target: { organizationId: string; role: OrganizationRole },
  ownerCount: number,
  nextRole: OrganizationRole | null
): void {
  if (!canManageMembership(context, target, ownerCount, nextRole)) {
    throw new Error("Membership change denied.")
  }
}
