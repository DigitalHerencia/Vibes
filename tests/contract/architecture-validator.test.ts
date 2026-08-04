import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const root = process.cwd()
const validator = join(root, "scripts", "validate-architecture.mjs")
const fixtures: string[] = []

function createFixture(): string {
  const fixture = mkdtempSync(join(tmpdir(), "vibes-architecture-"))
  fixtures.push(fixture)
  mkdirSync(join(fixture, "components"), { recursive: true })
  writeFileSync(join(fixture, "components", "card.tsx"), "export function Card() { return null }\n")
  return fixture
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true })
  }
})

describe("architecture validator", () => {
  it("accepts the current repository boundaries", () => {
    expect(() => execFileSync(process.execPath, [validator, "--root", root])).not.toThrow()
  })

  it("rejects a forbidden import and passes after the fixture is repaired", () => {
    const fixture = createFixture()
    const offender = join(fixture, "components", "bad.tsx")
    writeFileSync(offender, 'import { createProjectAction } from "@/lib/actions/projectActions"\n')

    const rejected = spawnSync(process.execPath, [validator, "--root", fixture], {
      encoding: "utf8",
    })

    expect(rejected.status).toBe(1)
    expect(rejected.stderr).toContain("components/bad.tsx")

    rmSync(offender)

    expect(() => execFileSync(process.execPath, [validator, "--root", fixture])).not.toThrow()
  })
})
