import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

import { projectDetailSelect, projectSummarySelect } from "@/lib/db/selects/project.selects"
import type {
  OrganizationMembershipDTO,
  ProjectDetailDTO,
  ProjectSummaryDTO,
} from "@/types/projectTypes"
import type { OrganizationRole } from "@/types/authzTypes"

type ProjectSummaryRecord = Prisma.ProjectGetPayload<{ select: typeof projectSummarySelect }>
type ProjectDetailRecord = Prisma.ProjectGetPayload<{ select: typeof projectDetailSelect }>

function roleForUser(
  memberships: Array<{ userId: string; role: OrganizationRole }>,
  userId: string
): OrganizationRole {
  return memberships.find((membership) => membership.userId === userId)?.role ?? "viewer"
}

export function mapProjectSummaryDTO(
  project: ProjectSummaryRecord,
  userId: string
): ProjectSummaryDTO {
  return {
    id: project.id,
    organizationId: project.organizationId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    role: roleForUser(project.organization.memberships, userId),
    updatedAt: project.updatedAt.toISOString(),
  }
}

function mapOrganizationMembershipDTO(
  membership: ProjectDetailRecord["organization"]["memberships"][number]
): OrganizationMembershipDTO {
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
    organizationId: project.organizationId,
    ownerId: project.ownerId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    role: roleForUser(
      project.organization.memberships.map((membership) => ({
        userId: membership.user.id,
        role: membership.role,
      })),
      userId
    ),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    memberships: project.organization.memberships.map(mapOrganizationMembershipDTO),
  }
}
