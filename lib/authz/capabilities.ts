import type { Capability, OrganizationRole } from "@/types/authzTypes"

const roleCapabilities = {
  owner: [
    "organization.read",
    "organization.manage",
    "membership.read",
    "membership.manage",
    "invitation.manage",
    "project.read",
    "project.create",
    "project.update",
    "project.archive",
    "audit.read",
    "billing.manage",
    "connect.manage",
  ],
  admin: [
    "organization.read",
    "membership.read",
    "membership.manage",
    "invitation.manage",
    "project.read",
    "project.create",
    "project.update",
    "project.archive",
    "audit.read",
  ],
  member: [
    "organization.read",
    "membership.read",
    "project.read",
    "project.create",
    "project.update",
  ],
  viewer: ["organization.read", "membership.read", "project.read"],
} as const satisfies Record<OrganizationRole, readonly Capability[]>

export function capabilitiesForRole(role: OrganizationRole): readonly Capability[] {
  return roleCapabilities[role]
}

export function hasCapability(role: OrganizationRole, capability: Capability): boolean {
  return capabilitiesForRole(role).some((candidate) => candidate === capability)
}
