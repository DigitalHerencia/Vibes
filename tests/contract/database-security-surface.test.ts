import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const migrationPath = join(
  root,
  "prisma",
  "migrations",
  "20260804062000_tenant_rls_baseline",
  "migration.sql"
)
const helperPath = join(root, "lib", "db", "withTenantContext.ts")
const migrationLockPath = join(root, "prisma", "migrations", "migration_lock.toml")

describe("database tenant-containment surface", () => {
  it("defines a non-owner, non-bypass runtime privilege role", () => {
    expect(existsSync(migrationPath)).toBe(true)
    expect(readFileSync(migrationLockPath, "utf8")).toContain('provider = "postgresql"')
    if (!existsSync(migrationPath)) return

    const migration = readFileSync(migrationPath, "utf8")
    expect(migration).toMatch(
      /CREATE ROLE vibes_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS/
    )
    expect(migration).toMatch(/REVOKE CREATE ON SCHEMA public FROM PUBLIC/)
    expect(migration).not.toMatch(/ALTER TABLE[^;]+OWNER TO vibes_runtime/)
  })

  it("forces explicit command policies on every tenant table", () => {
    expect(existsSync(migrationPath)).toBe(true)
    if (!existsSync(migrationPath)) return

    const migration = readFileSync(migrationPath, "utf8")
    const tenantTables = [
      "organizations",
      "memberships",
      "organization_invitations",
      "projects",
      "audit_events",
    ]

    for (const table of tenantTables) {
      expect(migration).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
      expect(migration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`)
      for (const operation of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        expect(migration).toMatch(
          new RegExp(
            `CREATE POLICY "${table}_${operation.toLowerCase()}"[\\s\\S]*?FOR ${operation}`
          )
        )
      }
    }
  })

  it("sets tenant context transaction-locally in one canonical helper", () => {
    expect(existsSync(helperPath)).toBe(true)
    if (!existsSync(helperPath)) return

    const helper = readFileSync(helperPath, "utf8")
    expect(helper).toContain("$transaction")
    expect(helper).toContain("set_config('app.current_organization_id'")
    expect(helper).toMatch(/set_config\([^;]+true\)/s)
    expect(helper).not.toMatch(/\bSET\s+app\.current_organization_id/i)
  })

  it("keeps raw tenant-context SQL out of every other source module", () => {
    const architectureTest = readFileSync(
      join(root, "tests", "contract", "architecture-surface.test.ts"),
      "utf8"
    )
    expect(architectureTest).toContain("withTenantContext.ts")
    expect(architectureTest).toContain("$executeRaw")
  })

  it("forces the ephemeral database URL to win over local dotenv files", () => {
    const harness = readFileSync(join(root, "scripts", "Test-PostgresRls.ps1"), "utf8")
    const prismaConfig = readFileSync(join(root, "prisma.config.ts"), "utf8")

    expect(harness).toContain('$env:VIBES_SKIP_DOTENV = "1"')
    expect(prismaConfig).toContain('process.env.VIBES_SKIP_DOTENV !== "1"')
  })
})
