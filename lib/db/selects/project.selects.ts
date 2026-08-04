import type { Prisma } from "@/prisma/generated/prisma/client"

export const projectMembershipSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
} satisfies Prisma.ProjectMembershipSelect

export const projectSummarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  updatedAt: true,
  memberships: {
    select: {
      userId: true,
      role: true,
    },
  },
} satisfies Prisma.ProjectSelect

export const projectDetailSelect = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    orderBy: { createdAt: "asc" },
    select: projectMembershipSelect,
  },
} satisfies Prisma.ProjectSelect
