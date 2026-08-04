import { clerk } from "@clerk/testing/playwright"
import { test as base } from "@playwright/test"

import { capabilitiesForRole } from "@/lib/authz/capabilities"
import type { Capability, OrganizationRole } from "@/types/authzTypes"

export type AuthenticatedAccountState = OrganizationRole | "disabled"

type AuthenticatedAccount = {
  state: AuthenticatedAccountState
  expectedCapabilities: readonly Capability[]
}

const emailEnvironmentVariables = {
  owner: "E2E_CLERK_OWNER_EMAIL",
  admin: "E2E_CLERK_ADMIN_EMAIL",
  member: "E2E_CLERK_MEMBER_EMAIL",
  viewer: "E2E_CLERK_VIEWER_EMAIL",
  disabled: "E2E_CLERK_DISABLED_EMAIL",
} as const satisfies Record<AuthenticatedAccountState, string>

export const authenticatedTest = base.extend<{
  accountState: AuthenticatedAccountState
  authenticatedAccount: AuthenticatedAccount
}>({
  accountState: ["viewer", { option: true }],
  authenticatedAccount: async ({ accountState, page }, provideAccount) => {
    const email = process.env[emailEnvironmentVariables[accountState]]
    if (!email) {
      throw new Error(`${emailEnvironmentVariables[accountState]} is required for this fixture.`)
    }

    await page.goto("/")
    await clerk.signIn({ page, emailAddress: email })

    await provideAccount({
      state: accountState,
      expectedCapabilities: accountState === "disabled" ? [] : capabilitiesForRole(accountState),
    })
  },
})

export { expect } from "@playwright/test"
