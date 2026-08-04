import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { relative, resolve } from "node:path"

const argumentsList = process.argv.slice(2)
const rootIndex = argumentsList.indexOf("--root")
const root = resolve(rootIndex >= 0 ? (argumentsList[rootIndex + 1] ?? ".") : ".")
const extensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"])
const excludedDirectories = new Set([".git", ".next", "coverage", "node_modules", "out"])

const importRules = [
  {
    roots: ["components"],
    forbidden: [
      "@/lib/actions",
      "@/lib/fetchers",
      "@/lib/db",
      "@/lib/integrations",
      "@/lib/webhooks",
      "@/lib/projects/workflows",
      "@/lib/organizations/workflows",
      "@/lib/billing/workflows",
      "@/lib/connect/workflows",
    ],
    reason: "components render and receive data and operations through props",
  },
  {
    roots: ["features"],
    forbidden: ["@/lib/db", "@/lib/integrations", "@/lib/webhooks", "@/prisma/", "@prisma/client"],
    reason: "features orchestrate through fetchers and actions rather than infrastructure",
  },
  {
    roots: ["app"],
    forbidden: ["@/lib/db", "@/prisma/", "@prisma/client"],
    reason: "routes adapt requests and cannot access persistence",
  },
  {
    roots: ["app"],
    forbidden: [
      "@/lib/actions",
      "@/lib/fetchers",
      "@/lib/projects/workflows",
      "@/lib/organizations/workflows",
      "@/lib/billing/workflows",
      "@/lib/connect/workflows",
      "@/lib/webhooks",
    ],
    reason: "routes select features and do not invoke protected operations directly",
    except: (file, specifier) =>
      specifier === "@/lib/webhooks" &&
      /app\/api\/(?:clerk|stripe(?:\/connect)?)\/webhooks\/route\.ts$/.test(file),
  },
  {
    roots: ["app"],
    forbidden: ["@/lib/integrations"],
    reason: "only provider webhook routes may adapt provider verification",
    except: (file) => /app\/api\/(?:clerk|stripe(?:\/connect)?)\/webhooks\/route\.ts$/.test(file),
  },
  {
    roots: ["schemas", "types"],
    forbidden: ["@/lib/db", "@/lib/integrations", "@/prisma/", "@prisma/client"],
    reason: "public schemas and contracts cannot depend on persistence or providers",
  },
  {
    roots: ["lib/fetchers", "lib/auth"],
    forbidden: [
      "@/lib/actions",
      "@/lib/integrations",
      "@/lib/webhooks",
      "@/lib/db/transactions",
      "@/prisma/",
      "@prisma/client",
    ],
    reason: "fetchers are read-only adapters over selects, DTOs, auth, and tenant context",
  },
  {
    roots: ["lib/actions"],
    forbidden: [
      "@/components",
      "@/features",
      "@/lib/db",
      "@/lib/fetchers",
      "@/lib/integrations",
      "@/lib/webhooks",
      "@/prisma/",
      "@prisma/client",
    ],
    reason: "Server Actions validate and delegate to workflows",
  },
  {
    roots: ["lib/db/transactions"],
    forbidden: [
      "@/lib/auth",
      "@/lib/cache",
      "@/lib/integrations",
      "@/lib/webhooks",
      "next/cache",
      "next/navigation",
    ],
    reason: "transaction helpers own minimal atomic persistence mechanics only",
  },
]

const contentRules = [
  {
    roots: ["components", "features"],
    forbidden: [/^[\t ]*["']use server["']/m],
    reason: "pure presentation and feature composition cannot declare Server Actions",
  },
  {
    roots: ["lib/fetchers", "lib/auth"],
    forbidden: [
      /\b(?:tx|prisma)\.\w+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
      /\$(?:execute|query)Raw/,
      /\b(?:revalidatePath|revalidateTag|redirect)\s*\(/,
    ],
    reason:
      "fetchers and session adapters cannot write, execute raw SQL, redirect, or invalidate cache",
  },
  {
    roots: ["lib/actions"],
    forbidden: [/catch\s*\{/],
    reason: "Server Actions cannot swallow unclassified errors",
  },
]

const guardedRoots = [
  "lib/fetchers",
  "lib/auth",
  "lib/db",
  "lib/integrations",
  "lib/webhooks",
  "lib/projects/workflows",
  "lib/organizations/workflows",
  "lib/billing/workflows",
  "lib/connect/workflows",
]

function sourceFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((entry) => {
    if (excludedDirectories.has(entry)) return []
    const path = resolve(directory, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    const extension = path.slice(path.lastIndexOf("."))
    return extensions.has(extension) ? [path] : []
  })
}

const violations = []

for (const rule of importRules) {
  for (const ownerRoot of rule.roots) {
    for (const file of sourceFiles(resolve(root, ownerRoot))) {
      const body = readFileSync(file, "utf8")
      const fileName = relative(root, file).replaceAll("\\", "/")
      for (const specifier of rule.forbidden) {
        if (body.includes(specifier) && !rule.except?.(fileName, specifier)) {
          violations.push(`${fileName}: ${rule.reason} (${specifier})`)
        }
      }
    }
  }
}

for (const rule of contentRules) {
  for (const ownerRoot of rule.roots) {
    for (const file of sourceFiles(resolve(root, ownerRoot))) {
      const body = readFileSync(file, "utf8")
      for (const pattern of rule.forbidden) {
        if (pattern.test(body)) {
          violations.push(
            `${relative(root, file).replaceAll("\\", "/")}: ${rule.reason} (${pattern.source})`
          )
        }
      }
    }
  }
}

for (const ownerRoot of guardedRoots) {
  for (const file of sourceFiles(resolve(root, ownerRoot))) {
    const body = readFileSync(file, "utf8")
    if (!body.includes('import "server-only"')) {
      violations.push(
        `${relative(root, file).replaceAll("\\", "/")}: server-owned modules require a server-only guard`
      )
    }
  }
}

const runtimeFiles = ["app", "features", "components", "lib", "schemas", "types"].flatMap(
  (directory) => sourceFiles(resolve(root, directory))
)
const proxyPath = resolve(root, "proxy.ts")
if (existsSync(proxyPath)) runtimeFiles.push(proxyPath)

for (const file of runtimeFiles) {
  const fileName = relative(root, file).replaceAll("\\", "/")
  const body = readFileSync(file, "utf8")
  if (/from\s+["']stripe["']/.test(body) && !fileName.startsWith("lib/integrations/stripe/")) {
    violations.push(`${fileName}: Stripe SDK imports belong to lib/integrations/stripe`)
  }
  if (
    body.includes("@clerk/nextjs/server") &&
    !fileName.startsWith("lib/auth/") &&
    fileName !== "proxy.ts"
  ) {
    violations.push(`${fileName}: Clerk backend imports belong to lib/auth or proxy.ts`)
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `Architecture validation failed:\n${[...new Set(violations)].sort().join("\n")}\n`
  )
  process.exitCode = 1
} else {
  process.stdout.write("Architecture boundaries validated.\n")
}
