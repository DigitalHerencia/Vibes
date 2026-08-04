import { describe, expect, it } from "vitest"

import { createProjectSchema, projectIdSchema, updateProjectSchema } from "@/schemas/projectSchemas"

describe("project schemas", () => {
  it("accepts valid create input", () => {
    const result = createProjectSchema.safeParse({
      name: "Operations Desk",
      description: "Internal workflow tracking.",
    })

    expect(result.success).toBe(true)
  })

  it("rejects short project names", () => {
    const result = createProjectSchema.safeParse({
      name: "A",
      description: "",
    })

    expect(result.success).toBe(false)
  })

  it("requires project id for updates", () => {
    expect(projectIdSchema.safeParse("").success).toBe(false)
    expect(
      updateProjectSchema.safeParse({
        projectId: "project_1",
        name: "Operations Desk",
        description: "",
      }).success
    ).toBe(true)
  })
})
