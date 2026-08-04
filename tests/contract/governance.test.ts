import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

const requiredAdrs = [
  "adr-0001-layer-ownership.md",
  "adr-0002-tenant-abstraction-and-naming.md",
  "adr-0003-local-rbac.md",
  "adr-0004-postgresql-rls-roles-and-context.md",
  "adr-0005-clerk-identity-boundary.md",
  "adr-0006-shared-webhook-ledger.md",
  "adr-0007-stripe-subscription-billing.md",
  "adr-0008-optional-stripe-connect.md",
  "adr-0009-presentation-catalog-isolation.md",
  "adr-0010-ci-and-vercel-ownership.md",
] as const

const requiredVouchReferences = [
  "reference-implementations/vouch/README.md",
  "reference-implementations/vouch/context/docs/architecture.md",
  "reference-implementations/vouch/context/docs/design-system-standards.md",
  "reference-implementations/vouch/context/docs/launch-checklist.md",
  "reference-implementations/vouch/context/docs/legal-and-copy.md",
  "reference-implementations/vouch/context/docs/product-doctrine.md",
  "reference-implementations/vouch/context/docs/ui-inventory.md",
  "reference-implementations/vouch/context/instructions/audit.agents.md",
  "reference-implementations/vouch/context/instructions/implementation.agents.md",
  "reference-implementations/vouch/context/instructions/validation.agents.md",
  "reference-implementations/vouch/.agents/contracts/domain-model.yaml",
  "reference-implementations/vouch/.agents/contracts/integrations.yaml",
  "reference-implementations/vouch/.agents/contracts/product.yaml",
  "reference-implementations/vouch/.agents/contracts/quality-gates.yaml",
  "reference-implementations/vouch/.agents/contracts/routes.yaml",
] as const

describe("governance structure", () => {
  it("keeps canonical governance links resolvable", () => {
    const documents = [
      "AGENTS.md",
      "README.md",
      ".agents/contracts/README.md",
      "context/docs/architecture-governance.md",
      "context/instructions/agent-architecture-rules.md",
      "docs/adr/README.md",
      "docs/evidence/README.md",
      "reference-implementations/README.md",
      "reference-implementations/vouch/README.md",
    ]
    const relativeLinks = documents.flatMap((document) => {
      const body = readFileSync(join(root, document), "utf8")
      return [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
        .map((match) => match[1])
        .filter(
          (target): target is string =>
            typeof target === "string" && !target.includes("://") && !target.startsWith("#")
        )
        .map((target) => ({ document, target: target.replace(/#.*$/, "") }))
    })

    expect(relativeLinks.length).toBeGreaterThan(0)
    expect(
      relativeLinks
        .filter(({ document, target }) => !existsSync(join(root, dirname(document), target)))
        .map(({ document, target }) => `${document}: ${target}`)
    ).toEqual([])
  })

  it("records every required architectural decision", () => {
    const adrDirectory = join(root, "docs", "adr")
    const actual = existsSync(adrDirectory)
      ? readdirSync(adrDirectory)
          .filter((file) => /^adr-\d{4}-.+\.md$/.test(file))
          .sort()
      : []

    expect(actual).toEqual([...requiredAdrs])
  })

  it("preserves Vouch material under an explicit reference-only root", () => {
    const missing = requiredVouchReferences.filter((path) => !existsSync(join(root, path)))

    expect(missing).toEqual([])
  })

  it("keeps reusable contracts free of Vouch-only rules", () => {
    const contractDirectory = join(root, ".agents", "contracts")
    const offenders = readdirSync(contractDirectory)
      .filter((file) => /\.ya?ml$/i.test(file))
      .filter((file) =>
        /\bvouch(?:es)?\b/i.test(readFileSync(join(contractDirectory, file), "utf8"))
      )

    expect(offenders).toEqual([])
  })

  it("does not publish stale execution JSON as current evidence", () => {
    const executionDirectory = join(root, ".agents", "execution")
    const jsonFiles = existsSync(executionDirectory)
      ? readdirSync(executionDirectory).filter((file) => file.endsWith(".json"))
      : []

    expect(jsonFiles).toEqual([])
  })
})
