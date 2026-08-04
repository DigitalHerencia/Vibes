import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import YAML from "yaml"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

describe("organization tenancy surface", () => {
  it("models Organization as the tenant and Project as a tenant-owned resource", () => {
    const schema = read("prisma/schema.prisma")

    expect(schema).toMatch(/model Organization \{/)
    expect(schema).toMatch(/model Membership \{/)
    expect(schema).toMatch(/model OrganizationInvitation \{/)
    expect(schema).toMatch(/model Project \{[\s\S]*?organizationId String/)
    expect(schema).toMatch(/@@unique\(\[organizationId, userId\]\)/)
    expect(schema).not.toMatch(/model ProjectMembership \{/)
  })

  it("publishes Organization authorization and the implemented RLS boundary", () => {
    const contract = YAML.parse(read(".agents/contracts/domain-model.yaml")) as {
      tenant: { selected_name: string; project_is_tenant: boolean; rls_implemented: boolean }
      authorization: { membership_model: string; capability_source: string }
    }

    expect(contract.tenant).toEqual(
      expect.objectContaining({
        selected_name: "Organization",
        project_is_tenant: false,
        rls_implemented: true,
      })
    )
    expect(contract.authorization).toEqual(
      expect.objectContaining({
        membership_model: "Membership",
        capability_source: "lib/authz/capabilities.ts",
      })
    )
  })
})
