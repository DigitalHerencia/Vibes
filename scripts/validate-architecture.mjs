import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { relative, resolve } from "node:path"

const argumentsList = process.argv.slice(2)
const rootIndex = argumentsList.indexOf("--root")
const root = resolve(rootIndex >= 0 ? (argumentsList[rootIndex + 1] ?? ".") : ".")
const extensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"])
const excludedDirectories = new Set([".git", ".next", "coverage", "node_modules", "out"])

const rules = [
  {
    roots: ["components"],
    forbidden: ["@/lib/actions", "@/lib/fetchers", "@/lib/db"],
    reason: "components render and cannot own protected operations or persistence",
  },
  {
    roots: ["app", "features", "components", "schemas"],
    forbidden: ["@/prisma/", "@prisma/client"],
    reason: "Prisma access remains in approved data-layer modules",
  },
  {
    roots: ["schemas"],
    forbidden: ["@/lib/db", "@/lib/integrations"],
    reason: "schemas validate untrusted input and cannot access infrastructure",
  },
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

for (const rule of rules) {
  for (const ownerRoot of rule.roots) {
    for (const file of sourceFiles(resolve(root, ownerRoot))) {
      const body = readFileSync(file, "utf8")
      for (const specifier of rule.forbidden) {
        if (body.includes(specifier)) {
          violations.push(
            `${relative(root, file).replaceAll("\\", "/")}: ${rule.reason} (${specifier})`
          )
        }
      }
    }
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
