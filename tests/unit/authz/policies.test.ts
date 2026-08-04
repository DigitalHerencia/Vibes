import { describe, expect, it } from "vitest"

import {
  canCreateInvitation,
  canManageMembership,
  canReadProject,
  canTransitionProjectStatus,
  canUpdateProject,
} from "@/lib/authz/policies"
import { capabilitiesForRole } from "@/lib/authz/capabilities"
import type { OrganizationRole, TenantContext } from "@/types/authzTypes"

function context(role: OrganizationRole, organizationId = "organization_1"): TenantContext {
  return {
    userId: `clerk_${role}`,
    localUser: {
      id: `user_${role}`,
      clerkUserId: `clerk_${role}`,
      email: `${role}@example.com`,
      displayName: role,
      status: "active",
    },
    organization: { id: organizationId, status: "active" },
    membership: { id: `membership_${role}`, role },
    capabilities: capabilitiesForRole(role),
  }
}

describe("layered organization authorization", () => {
  const activeProject = { organizationId: "organization_1", status: "active" as const }

  it("enforces tenant equality before project capabilities", () => {
    expect(canReadProject(context("owner"), activeProject)).toBe(true)
    expect(
      canReadProject(context("owner"), {
        ...activeProject,
        organizationId: "organization_other",
      })
    ).toBe(false)
  })

  it("separates project read, update, and workflow-state authority", () => {
    expect(canReadProject(context("viewer"), activeProject)).toBe(true)
    expect(canUpdateProject(context("viewer"), activeProject)).toBe(false)
    expect(canUpdateProject(context("member"), activeProject)).toBe(true)
    expect(canTransitionProjectStatus(context("admin"), activeProject, "archived")).toBe(true)
    expect(canTransitionProjectStatus(context("admin"), activeProject, "active")).toBe(false)
    expect(
      canTransitionProjectStatus(
        context("admin"),
        { ...activeProject, status: "archived" },
        "active"
      )
    ).toBe(true)
  })

  it("prevents removing or demoting the last owner", () => {
    const owner = context("owner")
    const target = { organizationId: "organization_1", role: "owner" as const }

    expect(canManageMembership(owner, target, 1, "admin")).toBe(false)
    expect(canManageMembership(owner, target, 1, null)).toBe(false)
    expect(canManageMembership(owner, target, 2, "admin")).toBe(true)
  })

  it("allows bounded invitations but never direct owner invitation", () => {
    expect(canCreateInvitation(context("admin"), "member")).toBe(true)
    expect(canCreateInvitation(context("admin"), "owner")).toBe(false)
    expect(canCreateInvitation(context("member"), "viewer")).toBe(false)
  })
})
