import "server-only"

import { requireTenantContext } from "@/lib/auth/session"
import { assertCanTransitionProjectStatus, assertCanUpdateProject } from "@/lib/authz/assertions"
import { canCreateProject } from "@/lib/authz/policies"
import { revalidateProjectSurfaces } from "@/lib/cache/revalidate"
import { withTenantContext } from "@/lib/db/withTenantContext"
import {
  createProjectTx,
  transitionProjectStatusTx,
  updateProjectTx,
} from "@/lib/db/transactions/projectTransactions"
import {
  transitionProjectStatusSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/schemas/projectSchemas"

export async function createProjectWorkflow(input: CreateProjectInput) {
  const context = await requireTenantContext()
  if (!canCreateProject(context)) throw new Error("Project creation denied.")

  const project = await withTenantContext(context.organization.id, (tx) =>
    createProjectTx(tx, {
      ...input,
      organizationId: context.organization.id,
      ownerId: context.localUser.id,
    })
  )

  revalidateProjectSurfaces({ userId: context.localUser.id, projectId: project.id })
  return project
}

export async function updateProjectWorkflow(input: UpdateProjectInput) {
  const context = await requireTenantContext()
  const updated = await withTenantContext(context.organization.id, (tx) =>
    updateProjectTx(
      tx,
      {
        ...input,
        organizationId: context.organization.id,
        actorUserId: context.localUser.id,
      },
      (project) => assertCanUpdateProject(context, project)
    )
  )

  revalidateProjectSurfaces({ userId: context.localUser.id, projectId: updated.id })
  return updated
}

export async function transitionProjectStatusWorkflow(input: unknown) {
  const parsed = transitionProjectStatusSchema.parse(input)
  const context = await requireTenantContext()
  const project = await withTenantContext(context.organization.id, (tx) =>
    transitionProjectStatusTx(
      tx,
      {
        ...parsed,
        organizationId: context.organization.id,
        actorUserId: context.localUser.id,
      },
      (current) => assertCanTransitionProjectStatus(context, current, parsed.status)
    )
  )

  revalidateProjectSurfaces({ userId: context.localUser.id, projectId: project.id })
  return project
}
