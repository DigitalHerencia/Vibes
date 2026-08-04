import type { Prisma } from "@/prisma/generated/prisma/client"

import type {
  ProjectDetailDTO,
  ProjectMembershipDTO,
  ProjectRole,
  ProjectSummaryDTO,
} from "@/types/projectTypes"
import { projectDetailSelect, projectSummarySelect } from "@/lib/db/selects/project.selects"

type ProjectSummaryRecord = Prisma.ProjectGetPayload<{ select: typeof projectSummarySelect }>
type ProjectDetailRecord = Prisma.ProjectGetPayload<{ select: typeof projectDetailSelect }>

function roleForUser(
  memberships: Array<{ userId: string; role: ProjectRole }>,
  userId: string
): ProjectRole {
  return memberships.find((membership) => membership.userId === userId)?.role ?? "viewer"
}

export function mapProjectSummaryDTO(
  project: ProjectSummaryRecord,
  userId: string
): ProjectSummaryDTO {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    role: roleForUser(project.memberships, userId),
    updatedAt: project.updatedAt.toISOString(),
  }
}

function mapProjectMembershipDTO(
  membership: ProjectDetailRecord["memberships"][number]
): ProjectMembershipDTO {
  return {
    id: membership.id,
    userId: membership.user.id,
    email: membership.user.email,
    displayName: membership.user.displayName,
    role: membership.role,
    createdAt: membership.createdAt.toISOString(),
  }
}

export function mapProjectDetailDTO(
  project: ProjectDetailRecord,
  userId: string
): ProjectDetailDTO {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    role: roleForUser(
      project.memberships.map((membership) => ({
        userId: membership.user.id,
        role: membership.role,
      })),
      userId
    ),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    memberships: project.memberships.map(mapProjectMembershipDTO),
  }
}
