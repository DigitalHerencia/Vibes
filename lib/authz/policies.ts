import type { AuthenticatedUserContext } from "@/types/authTypes"
import type { ProjectRole } from "@/types/projectTypes"

type ProjectAccessRecord = {
  ownerId: string
  memberships: Array<{
    userId: string
    role: ProjectRole
  }>
}

function roleForProject(
  context: AuthenticatedUserContext,
  project: ProjectAccessRecord
): ProjectRole | null {
  if (project.ownerId === context.localUser.id) return "owner"

  return (
    project.memberships.find((membership) => membership.userId === context.localUser.id)?.role ??
    null
  )
}

export function canReadProject(
  context: AuthenticatedUserContext,
  project: ProjectAccessRecord
): boolean {
  return roleForProject(context, project) !== null
}

export function canUpdateProject(
  context: AuthenticatedUserContext,
  project: ProjectAccessRecord
): boolean {
  return roleForProject(context, project) === "owner"
}

export function canManageProjectMembers(
  context: AuthenticatedUserContext,
  project: ProjectAccessRecord
): boolean {
  return roleForProject(context, project) === "owner"
}
