import "server-only"

import { unstable_noStore as noStore } from "next/cache"

import { assertCanReadProject } from "@/lib/authz/assertions"
import { requireTenantContext } from "@/lib/auth/session"
import { mapProjectDetailDTO, mapProjectSummaryDTO } from "@/lib/db/dto/project.mappers"
import { withTenantContext } from "@/lib/db/withTenantContext"
import { projectDetailSelect, projectSummarySelect } from "@/lib/db/selects/project.selects"
import { projectIdSchema } from "@/schemas/projectSchemas"
import type { ProjectDetailDTO, ProjectListStateDTO } from "@/types/projectTypes"

export async function getProjectListState(): Promise<ProjectListStateDTO> {
  noStore()

  const context = await requireTenantContext()
  const projects = await withTenantContext(context.organization.id, (tx) =>
    tx.project.findMany({
      where: {
        status: "active",
        organizationId: context.organization.id,
      },
      orderBy: { updatedAt: "desc" },
      take: 24,
      select: projectSummarySelect,
    })
  )

  return {
    projects: projects.map((project) => mapProjectSummaryDTO(project, context.localUser.id)),
    empty: projects.length === 0,
  }
}

export async function getProjectDetailState(projectId: string): Promise<ProjectDetailDTO> {
  noStore()

  const context = await requireTenantContext()
  const parsedProjectId = projectIdSchema.parse(projectId)
  const project = await withTenantContext(context.organization.id, (tx) =>
    tx.project.findFirst({
      where: { id: parsedProjectId, organizationId: context.organization.id },
      select: projectDetailSelect,
    })
  )

  if (!project) {
    throw new Error("Project not found.")
  }

  assertCanReadProject(context, project)

  return mapProjectDetailDTO(project, context.localUser.id)
}
