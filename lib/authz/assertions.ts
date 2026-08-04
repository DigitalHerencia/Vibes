import type { AuthenticatedUserContext } from "@/types/authTypes"
import { canReadProject, canUpdateProject } from "@/lib/authz/policies"

type ProjectAccessRecord = {
  ownerId: string
  memberships: Array<{
    userId: string
    role: "owner" | "member" | "viewer"
  }>
}

export function assertCanReadProject(
  context: AuthenticatedUserContext,
  project: ProjectAccessRecord
): void {
  if (!canReadProject(context, project)) {
    throw new Error("Project access denied.")
  }
}

export function assertCanUpdateProject(
  context: AuthenticatedUserContext,
  project: ProjectAccessRecord
): void {
  if (!canUpdateProject(context, project)) {
    throw new Error("Project update denied.")
  }
}
