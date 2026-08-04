"use server"

import { redirect } from "next/navigation"

import { assertCanUpdateProject } from "@/lib/authz/assertions"
import { requireCurrentUserContext } from "@/lib/auth/session"
import { revalidateProjectSurfaces } from "@/lib/cache/revalidate"
import { getPrisma } from "@/lib/db/prisma"
import { projectDetailSelect } from "@/lib/db/selects/project.selects"
import { createProjectTx, updateProjectTx } from "@/lib/db/transactions/projectTransactions"
import { createProjectSchema, updateProjectSchema } from "@/schemas/projectSchemas"
import { actionFailure, actionSuccess, type ActionResult } from "@/types/actionResultTypes"

function formString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export async function createProjectAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const context = await requireCurrentUserContext()
  const parsed = createProjectSchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
  })

  if (!parsed.success) {
    return actionFailure(
      "INVALID_INPUT",
      "Check the project details.",
      parsed.error.flatten().fieldErrors
    )
  }

  const prisma = getPrisma()
  const project = await prisma.$transaction((tx) =>
    createProjectTx(tx, {
      ...parsed.data,
      ownerId: context.localUser.id,
    })
  )

  revalidateProjectSurfaces({ userId: context.localUser.id, projectId: project.id })
  redirect(`/projects/${project.id}`)
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const context = await requireCurrentUserContext()
  const parsed = updateProjectSchema.safeParse({
    projectId,
    name: formString(formData, "name"),
    description: formString(formData, "description"),
  })

  if (!parsed.success) {
    return actionFailure(
      "INVALID_INPUT",
      "Check the project details.",
      parsed.error.flatten().fieldErrors
    )
  }

  const prisma = getPrisma()
  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: projectDetailSelect,
  })

  if (!project) {
    return actionFailure("NOT_FOUND", "Project not found.")
  }

  assertCanUpdateProject(context, {
    ownerId: project.ownerId,
    memberships: project.memberships.map((membership) => ({
      userId: membership.user.id,
      role: membership.role,
    })),
  })

  const updated = await prisma.$transaction((tx) =>
    updateProjectTx(tx, {
      ...parsed.data,
      actorUserId: context.localUser.id,
    })
  )

  revalidateProjectSurfaces({ userId: context.localUser.id, projectId: updated.id })
  return actionSuccess({ id: updated.id })
}
