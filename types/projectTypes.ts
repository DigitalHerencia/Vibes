import type { OrganizationRole } from "@/types/authzTypes"
import type { ActionResult } from "@/types/actionResultTypes"

export type ProjectActionState = ActionResult<{ id: string }> | null

export type OrganizationMembershipDTO = {
  id: string
  userId: string
  email: string | null
  displayName: string | null
  role: OrganizationRole
  createdAt: string
}

export type ProjectSummaryDTO = {
  id: string
  organizationId: string
  name: string
  slug: string
  description: string | null
  role: OrganizationRole
  status: "active" | "archived"
  updatedAt: string
}

export type ProjectDetailDTO = ProjectSummaryDTO & {
  ownerId: string
  createdAt: string
  memberships: OrganizationMembershipDTO[]
}

export type ProjectListStateDTO = {
  projects: ProjectSummaryDTO[]
  empty: boolean
}

export type DashboardStateDTO = {
  projectCount: number
  recentProjects: ProjectSummaryDTO[]
  empty: boolean
}
