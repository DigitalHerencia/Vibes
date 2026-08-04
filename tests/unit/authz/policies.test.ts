import { describe, expect, it } from "vitest"

import { canManageProjectMembers, canReadProject, canUpdateProject } from "@/lib/authz/policies"
import type { AuthenticatedUserContext } from "@/types/authTypes"

function context(userId: string): AuthenticatedUserContext {
  return {
    userId: `clerk_${userId}`,
    localUser: {
      id: userId,
      clerkUserId: `clerk_${userId}`,
      email: `${userId}@example.com`,
      displayName: userId,
      status: "active",
    },
  }
}

describe("project authz policies", () => {
  const project = {
    ownerId: "user_owner",
    memberships: [
      { userId: "user_owner", role: "owner" as const },
      { userId: "user_member", role: "member" as const },
      { userId: "user_viewer", role: "viewer" as const },
    ],
  }

  it("allows owner, member, and viewer reads", () => {
    expect(canReadProject(context("user_owner"), project)).toBe(true)
    expect(canReadProject(context("user_member"), project)).toBe(true)
    expect(canReadProject(context("user_viewer"), project)).toBe(true)
  })

  it("allows only owners to update and manage members", () => {
    expect(canUpdateProject(context("user_owner"), project)).toBe(true)
    expect(canManageProjectMembers(context("user_owner"), project)).toBe(true)

    expect(canUpdateProject(context("user_member"), project)).toBe(false)
    expect(canManageProjectMembers(context("user_member"), project)).toBe(false)
  })

  it("denies cross-row access", () => {
    expect(canReadProject(context("user_other"), project)).toBe(false)
    expect(canUpdateProject(context("user_other"), project)).toBe(false)
    expect(canManageProjectMembers(context("user_other"), project)).toBe(false)
  })
})
