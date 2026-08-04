import "server-only"

import { unstable_noStore as noStore } from "next/cache"

import { assertCanReadProject } from "@/lib/authz/assertions"
import { requireCurrentUserContext } from "@/lib/auth/session"
import { mapProjectDetailDTO, mapProjectSummaryDTO } from "@/lib/db/dto/project.mappers"
import { getPrisma } from "@/lib/db/prisma"
import { projectDetailSelect, projectSummarySelect } from "@/lib/db/selects/project.selects"
import { projectIdSchema } from "@/schemas/projectSchemas"
import type { ProjectDetailDTO, ProjectListStateDTO } from "@/types/projectTypes"

export async function getProjectListState(): Promise<ProjectListStateDTO> {
  noStore()

  const context = await requireCurrentUserContext()
  const prisma = getPrisma()
  const projects = await prisma.project.findMany({
    where: {
      status: "active",
      memberships: {
        some: {
          userId: context.localUser.id,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: projectSummarySelect,
  })

  return {
    projects: projects.map((project) => mapProjectSummaryDTO(project, context.localUser.id)),
    empty: projects.length === 0,
  }
}

export async function getProjectDetailState(projectId: string): Promise<ProjectDetailDTO> {
  noStore()

  const context = await requireCurrentUserContext()
  const parsedProjectId = projectIdSchema.parse(projectId)
  const prisma = getPrisma()

  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    select: projectDetailSelect,
  })

  if (!project) {
    throw new Error("Project not found.")
  }

  assertCanReadProject(context, {
    ownerId: project.ownerId,
    memberships: project.memberships.map((membership) => ({
      userId: membership.user.id,
      role: membership.role,
    })),
  })

  return mapProjectDetailDTO(project, context.localUser.id)
}
