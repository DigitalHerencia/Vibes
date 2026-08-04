import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const contractFiles = [
  ".agents/contracts/architecture-boundaries.yml",
  ".agents/contracts/database-security.yaml",
  ".agents/contracts/domain-model.yaml",
  ".agents/contracts/integrations.yaml",
  ".agents/contracts/product.yaml",
  ".agents/contracts/quality-gates.yaml",
  ".agents/contracts/routes.yaml",
  ".agents/contracts/server-operations.yaml",
]

for (const file of contractFiles) {
  const body = await readFile(join(root, file), "utf8")
  const parsed = YAML.parse(body)

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`${file} did not parse to an object`)
  }
}

console.log(`Validated ${contractFiles.length} agent contract files.`)
