export type AuditEventName =
  | "organization.created"
  | "organization.invitation.created"
  | "organization.membership.role_changed"
  | "organization.membership.removed"
  | "project.created"
  | "project.status_changed"
  | "project.updated"

export type AuditEntityType = "organization" | "organization_invitation" | "membership" | "project"

export type BoundedAuditEvent = {
  eventName: AuditEventName
  actorUserId: string
  entityType: AuditEntityType
  entityId: string
  organizationId: string
  projectId?: string
  requestId?: string
  metadata?: Record<string, string | number | boolean | null>
}
