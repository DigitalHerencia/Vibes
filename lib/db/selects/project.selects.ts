import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

export const organizationMembershipSelect = {
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
} satisfies Prisma.MembershipSelect

export const projectSummarySelect = {
  id: true,
  organizationId: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  updatedAt: true,
  organization: {
    select: {
      memberships: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  },
} satisfies Prisma.ProjectSelect

export const projectDetailSelect = {
  id: true,
  organizationId: true,
  ownerId: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  organization: {
    select: {
      memberships: {
        orderBy: { createdAt: "asc" },
        select: organizationMembershipSelect,
      },
    },
  },
} satisfies Prisma.ProjectSelect
