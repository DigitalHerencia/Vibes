export type ProjectRole = "owner" | "member" | "viewer"

export type ProjectMembershipDTO = {
  id: string
  userId: string
  email: string | null
  displayName: string | null
  role: ProjectRole
  createdAt: string
}

export type ProjectSummaryDTO = {
  id: string
  name: string
  slug: string
  description: string | null
  role: ProjectRole
  status: "active" | "archived"
  updatedAt: string
}

export type ProjectDetailDTO = ProjectSummaryDTO & {
  ownerId: string
  createdAt: string
  memberships: ProjectMembershipDTO[]
}

export type ProjectListStateDTO = {
  projects: ProjectSummaryDTO[]
  empty: boolean
}
