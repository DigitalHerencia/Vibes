import { describe, expect, it } from "vitest"

import {
  createOrganizationSchema,
  inviteOrganizationMemberSchema,
  updateMembershipSchema,
} from "@/schemas/organizationSchemas"

describe("organization schemas", () => {
  it("validates organization names without accepting authority fields", () => {
    expect(createOrganizationSchema.parse({ name: "  Northwind Ops  " })).toEqual({
      name: "Northwind Ops",
    })
    expect(createOrganizationSchema.safeParse({ name: "Northwind", role: "owner" }).success).toBe(
      false
    )
  })

  it("normalizes invitation email and rejects direct owner invitation", () => {
    expect(
      inviteOrganizationMemberSchema.parse({ email: "  ADMIN@Example.com ", role: "admin" })
    ).toEqual({ email: "admin@example.com", role: "admin" })
    expect(
      inviteOrganizationMemberSchema.safeParse({ email: "owner@example.com", role: "owner" })
        .success
    ).toBe(false)
  })

  it("allows a membership role change or removal without accepting tenant input", () => {
    expect(updateMembershipSchema.parse({ membershipId: "membership_1", role: "viewer" })).toEqual({
      membershipId: "membership_1",
      role: "viewer",
    })
    expect(updateMembershipSchema.parse({ membershipId: "membership_1", role: null })).toEqual({
      membershipId: "membership_1",
      role: null,
    })
    expect(
      updateMembershipSchema.safeParse({
        membershipId: "membership_1",
        role: "viewer",
        organizationId: "organization_other",
      }).success
    ).toBe(false)
  })
})
