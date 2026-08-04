import { describe, expect, it } from "vitest"

import { mapProjectDetailDTO, mapProjectSummaryDTO } from "@/lib/db/dto/project.mappers"

describe("project DTO mappers", () => {
  const now = new Date("2026-05-20T18:00:00.000Z")

  it("maps summary records to transport-safe DTOs", () => {
    const dto = mapProjectSummaryDTO(
      {
        id: "project_1",
        organizationId: "organization_1",
        name: "Operations Desk",
        slug: "operations-desk",
        description: null,
        status: "active",
        updatedAt: now,
        organization: {
          memberships: [{ userId: "user_1", role: "owner" }],
        },
      },
      "user_1"
    )

    expect(dto.updatedAt).toBe("2026-05-20T18:00:00.000Z")
    expect(dto.role).toBe("owner")
    expect(dto).not.toHaveProperty("memberships")
  })

  it("maps detail records without leaking Date objects", () => {
    const dto = mapProjectDetailDTO(
      {
        id: "project_1",
        organizationId: "organization_1",
        ownerId: "user_1",
        name: "Operations Desk",
        slug: "operations-desk",
        description: "Internal workflow tracking.",
        status: "active",
        createdAt: now,
        updatedAt: now,
        organization: {
          memberships: [
            {
              id: "membership_1",
              role: "owner",
              createdAt: now,
              user: {
                id: "user_1",
                email: "owner@example.com",
                displayName: "Owner",
              },
            },
          ],
        },
      },
      "user_1"
    )

    expect(dto.createdAt).toBe("2026-05-20T18:00:00.000Z")
    expect(dto.memberships[0]?.createdAt).toBe("2026-05-20T18:00:00.000Z")
  })
})
