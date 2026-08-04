import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import YAML from "yaml"

const root = process.cwd()

function files(...directories: string[]): string[] {
  function walk(directory: string): string[] {
    const absoluteDirectory = join(root, directory)
    if (!existsSync(absoluteDirectory)) return []

    return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
      const relativePath = `${directory}/${entry.name}`.replaceAll("\\", "/")
      if (entry.isDirectory()) return walk(relativePath)
      return entry.isFile() ? [relativePath] : []
    })
  }

  return directories.flatMap(walk).sort()
}

const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]

function resolvesLocalImport(specifier: string): boolean {
  const target = join(root, specifier.slice(2))
  return (
    sourceExtensions.some((extension) => existsSync(`${target}${extension}`)) ||
    sourceExtensions.some((extension) => existsSync(join(target, `index${extension}`)))
  )
}

describe("architecture surface", () => {
  it("keeps Prisma imports out of routes, features, and components", () => {
    const sourceFiles = files("app", "features", "components")
    const offenders = sourceFiles.filter((file) => {
      const body = readFileSync(join(root, file), "utf8")
      return body.includes("@/prisma/") || body.includes('from "@prisma')
    })

    expect(offenders).toEqual([])
  })

  it("keeps actions and fetchers out of pure components", () => {
    const sourceFiles = files("components")
    const offenders = sourceFiles.filter((file) => {
      const body = readFileSync(join(root, file), "utf8")
      return body.includes("@/lib/actions") || body.includes("@/lib/fetchers")
    })

    expect(offenders).toEqual([])
  })

  it("keeps app API routes scoped to provider webhooks", () => {
    const routes = files("app/api")
    expect(routes).toEqual([
      "app/api/clerk/webhooks/route.ts",
      "app/api/stripe/connect/webhooks/route.ts",
      "app/api/stripe/webhooks/route.ts",
    ])
  })

  it("resolves every local alias import from committed source", () => {
    const sourceFiles = files("app", "components", "features", "lib", "schemas", "tests")
    const unresolved = sourceFiles.flatMap((file) => {
      const body = readFileSync(join(root, file), "utf8")
      const specifiers = [...body.matchAll(/(?:from\s+|import\s*\()\s*[\"'](@\/[^\"']+)[\"']/g)]
      return specifiers
        .map((match) => match[1])
        .filter((specifier): specifier is string => Boolean(specifier))
        .filter((specifier) => !resolvesLocalImport(specifier))
        .map((specifier) => `${file}: ${specifier}`)
    })

    expect([...new Set(unresolved)].sort()).toEqual([])
  })

  it("does not retain Vouch-only runtime imports", () => {
    const sourceFiles = files("app", "components", "features", "lib", "schemas")
    const offenders = sourceFiles.filter((file) => {
      const body = readFileSync(join(root, file), "utf8")
      return /@\/(?:components\/vouches|content\/vouches)/.test(body)
    })

    expect(offenders).toEqual([])
  })

  it("parses agent contracts as YAML", () => {
    const contractFiles = files(".agents/contracts").filter((file) => /\.ya?ml$/i.test(file))
    for (const file of contractFiles) {
      const parsed = YAML.parse(readFileSync(join(root, file), "utf8"))
      expect(parsed).toBeTruthy()
    }
  })

  it("keeps raw database execution inside the canonical tenant helper", () => {
    const sourceFiles = files("lib").filter((file) =>
      sourceExtensions.some((extension) => file.endsWith(extension))
    )
    const offenders = sourceFiles.filter((file) => {
      if (file === "lib/db/withTenantContext.ts") return false
      const body = readFileSync(join(root, file), "utf8")
      return body.includes("$executeRaw") || body.includes("$queryRaw")
    })

    expect(offenders).toEqual([])
  })
})
