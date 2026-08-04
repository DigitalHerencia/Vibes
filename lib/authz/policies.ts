import type { Capability, OrganizationRole, TenantContext } from "@/types/authzTypes"

type ProjectAccessRecord = {
  organizationId: string
  status: "active" | "archived"
}

type MembershipAccessRecord = {
  organizationId: string
  role: OrganizationRole
}

function hasTenantCapability(context: TenantContext, capability: Capability): boolean {
  return (
    context.organization.status === "active" &&
    context.capabilities.some((candidate) => candidate === capability)
  )
}

function isCurrentTenant(context: TenantContext, organizationId: string): boolean {
  return context.organization.id === organizationId
}

export function canReadProject(context: TenantContext, project: ProjectAccessRecord): boolean {
  return (
    isCurrentTenant(context, project.organizationId) && hasTenantCapability(context, "project.read")
  )
}

export function canCreateProject(context: TenantContext): boolean {
  return hasTenantCapability(context, "project.create")
}

export function canUpdateProject(context: TenantContext, project: ProjectAccessRecord): boolean {
  return (
    project.status === "active" &&
    isCurrentTenant(context, project.organizationId) &&
    hasTenantCapability(context, "project.update")
  )
}

export function canTransitionProjectStatus(
  context: TenantContext,
  project: ProjectAccessRecord,
  nextStatus: ProjectAccessRecord["status"]
): boolean {
  if (!isCurrentTenant(context, project.organizationId)) return false
  if (!hasTenantCapability(context, "project.archive")) return false

  return (
    (project.status === "active" && nextStatus === "archived") ||
    (project.status === "archived" && nextStatus === "active")
  )
}

export function canManageMembership(
  context: TenantContext,
  target: MembershipAccessRecord,
  ownerCount: number,
  nextRole: OrganizationRole | null
): boolean {
  if (!isCurrentTenant(context, target.organizationId)) return false
  if (!hasTenantCapability(context, "membership.manage")) return false
  if (target.role === "owner" && context.membership.role !== "owner") return false
  if (nextRole === "owner" && context.membership.role !== "owner") return false

  const removesOwner = target.role === "owner" && nextRole !== "owner"
  return !removesOwner || ownerCount > 1
}

export function canCreateInvitation(context: TenantContext, role: OrganizationRole): boolean {
  return role !== "owner" && hasTenantCapability(context, "invitation.manage")
}
