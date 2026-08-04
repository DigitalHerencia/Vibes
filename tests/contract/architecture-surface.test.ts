import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import YAML from "yaml"

const root = process.cwd()

function files(commandPattern: string): string[] {
  const output = execSync(commandPattern, { cwd: root, encoding: "utf8" }).trim()
  return output ? output.split(/\r?\n/).map((file) => file.replaceAll("\\", "/")) : []
}

describe("architecture surface", () => {
  it("keeps Prisma imports out of routes, features, and components", () => {
    const sourceFiles = files("rg --files app features components")
    const offenders = sourceFiles.filter((file) => {
      const body = readFileSync(join(root, file), "utf8")
      return body.includes("@/prisma/") || body.includes("from \"@prisma")
    })

    expect(offenders).toEqual([])
  })

  it("keeps actions and fetchers out of pure components", () => {
    const sourceFiles = files("rg --files components")
    const offenders = sourceFiles.filter((file) => {
      const body = readFileSync(join(root, file), "utf8")
      return body.includes("@/lib/actions") || body.includes("@/lib/fetchers")
    })

    expect(offenders).toEqual([])
  })

  it("keeps app API routes scoped to provider webhooks", () => {
    const routes = files("rg --files app/api")
    expect(routes).toEqual(["app/api/clerk/webhooks/route.ts"])
  })

  it("parses agent contracts as YAML", () => {
    const contractFiles = files("rg --files .agents/contracts")
    for (const file of contractFiles) {
      const parsed = YAML.parse(readFileSync(join(root, file), "utf8"))
      expect(parsed).toBeTruthy()
    }
  })
})
