"use server"

import { redirect } from "next/navigation"

import {
  createProjectWorkflow,
  updateProjectWorkflow,
} from "@/lib/projects/workflows/projectWorkflows"
import { createProjectSchema, updateProjectSchema } from "@/schemas/projectSchemas"
import { actionFailure, actionSuccess, type ActionResult } from "@/types/actionResultTypes"
import type { ProjectActionState } from "@/types/projectTypes"

function formString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export async function createProjectAction(
  _previousState: ProjectActionState,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
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

  const project = await createProjectWorkflow(parsed.data)
  redirect(`/projects/${project.id}`)
}

export async function updateProjectAction(
  projectId: string,
  _previousState: ProjectActionState,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
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

  const updated = await updateProjectWorkflow(parsed.data)
  return actionSuccess({ id: updated.id })
}
