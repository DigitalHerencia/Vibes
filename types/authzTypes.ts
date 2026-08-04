import type { AuthenticatedUserContext } from "@/types/authTypes"

export type OrganizationRole = "owner" | "admin" | "member" | "viewer"

export type Capability =
  | "organization.read"
  | "organization.manage"
  | "membership.read"
  | "membership.manage"
  | "invitation.manage"
  | "project.read"
  | "project.create"
  | "project.update"
  | "project.archive"
  | "audit.read"
  | "billing.manage"
  | "connect.manage"

export type TenantContext = AuthenticatedUserContext & {
  organization: {
    id: string
    status: "active" | "suspended"
  }
  membership: {
    id: string
    role: OrganizationRole
  }
  capabilities: readonly Capability[]
}
