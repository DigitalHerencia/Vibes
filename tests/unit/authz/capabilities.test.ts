import { describe, expect, it } from "vitest"

import { capabilitiesForRole, hasCapability } from "@/lib/authz/capabilities"

describe("organization role capabilities", () => {
  it("gives owners tenant, membership, invitation, project, audit, and billing authority", () => {
    expect(capabilitiesForRole("owner")).toEqual(
      expect.arrayContaining([
        "organization.manage",
        "membership.manage",
        "invitation.manage",
        "project.archive",
        "audit.read",
        "billing.manage",
        "connect.manage",
      ])
    )
  })

  it("keeps billing and organization management out of delegated roles", () => {
    expect(hasCapability("admin", "billing.manage")).toBe(false)
    expect(hasCapability("admin", "connect.manage")).toBe(false)
    expect(hasCapability("admin", "organization.manage")).toBe(false)
    expect(hasCapability("member", "membership.manage")).toBe(false)
    expect(hasCapability("viewer", "project.update")).toBe(false)
  })
})
