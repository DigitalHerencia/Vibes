import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import YAML from "yaml"

const root = process.cwd()
const workflowPath = join(root, ".github", "workflows", "pull-request-validation.yml")
const specificationPath = join(root, "spec", "spec-process-cicd-pull-request-validation.md")

type Workflow = {
  on?: Record<string, unknown>
  permissions?: Record<string, string>
  concurrency?: { group?: string; "cancel-in-progress"?: boolean }
  jobs?: Record<
    string,
    {
      "runs-on"?: string
      "timeout-minutes"?: number
      permissions?: Record<string, string>
      steps?: Array<{ uses?: string; run?: string }>
    }
  >
}

describe("pull-request validation workflow", () => {
  it("has a maintained behavioral specification", () => {
    expect(existsSync(specificationPath)).toBe(true)
  })

  it("uses one read-only, cancellable validation job", () => {
    expect(existsSync(workflowPath)).toBe(true)
    const workflow = YAML.parse(readFileSync(workflowPath, "utf8")) as Workflow

    expect(Object.keys(workflow.on ?? {}).sort()).toEqual(["pull_request", "workflow_dispatch"])
    expect(workflow.permissions).toEqual({ contents: "read" })
    expect(workflow.concurrency?.["cancel-in-progress"]).toBe(true)
    expect(Object.keys(workflow.jobs ?? {})).toEqual(["validation"])

    const job = workflow.jobs?.validation
    expect(job?.["runs-on"]).toBe("ubuntu-latest")
    expect(job?.["timeout-minutes"]).toBeLessThanOrEqual(20)
    expect(job?.permissions).toEqual({ contents: "read" })
  })

  it("runs the same credential-free gate as local development", () => {
    const body = readFileSync(workflowPath, "utf8")
    const workflow = YAML.parse(body) as Workflow
    const steps = workflow.jobs?.validation?.steps ?? []
    const actions = steps.flatMap((step) => (step.uses ? [step.uses] : []))
    const commands = steps.flatMap((step) => (step.run ? [step.run] : [])).join("\n")

    expect(actions.length).toBeGreaterThan(0)
    expect(actions.every((action) => /@[a-f0-9]{40}$/.test(action.split(" #")[0] ?? ""))).toBe(true)
    expect(commands).toContain("corepack pnpm install --frozen-lockfile")
    expect(commands).toContain("corepack pnpm validate:ci")
    expect(body).not.toMatch(/playwright|coverage|migrate|deploy|environment:/i)
  })
})
