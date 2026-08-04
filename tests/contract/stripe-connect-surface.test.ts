import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

function walk(directory: string): string[] {
  const absolute = join(root, directory)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`.replaceAll("\\", "/")
    return entry.isDirectory() ? walk(path) : [path]
  })
}

describe("optional Stripe Connect boundaries", () => {
  it("keeps subscription billing independent of Connect", () => {
    const subscriptionFiles = [
      ...walk("lib/billing"),
      "lib/integrations/stripe/billing.ts",
      "lib/integrations/stripe/subscriptionStatus.ts",
      "lib/integrations/stripe/webhooks.ts",
      ...walk("app/api/stripe/webhooks"),
    ]
    const offenders = subscriptionFiles.filter((file) => /connect/i.test(read(file)))
    expect(offenders).toEqual([])
  })

  it("keeps provider SDK access in the Stripe integration layer", () => {
    const sourceFiles = [...walk("app"), ...walk("lib"), ...walk("schemas")].filter((file) =>
      file.endsWith(".ts")
    )
    const offenders = sourceFiles.filter(
      (file) =>
        !file.startsWith("lib/integrations/stripe/") && /from ["']stripe["']/.test(read(file))
    )
    expect(offenders).toEqual([])
  })

  it("keeps money, fees, currency, readiness, and provider scope out of action input", () => {
    const actions = read("lib/actions/connectActions.ts")
    expect(actions).not.toMatch(
      /amountMinor|currency|platformFee|accountId|chargesEnabled|payoutsEnabled/
    )
    expect(actions).toContain("connectResourceIdSchema.safeParse(paymentId)")
    const policy = read("lib/connect/policy.ts")
    expect(policy).toContain('getRequiredEnv("STRIPE_CONNECT_CURRENCY")')
    expect(policy).toContain('integerEnv("STRIPE_CONNECT_PLATFORM_FEE_BPS"')
  })

  it("uses destination charges, manual capture, and liability-preserving refunds", () => {
    const provider = read("lib/integrations/stripe/connect.ts")
    expect(provider).toContain('capture_method: "manual"')
    expect(provider).toContain("transfer_data: { destination: input.connectedAccountId }")
    expect(provider).toContain("{ application_fee_amount: input.platformFeeMinor }")
    expect(provider).toContain("reverse_transfer: true")
    expect(provider).toContain("refund_application_fee: true")
  })

  it("declares an executable physical-removal proof", () => {
    expect(read("package.json")).toContain('"test:connect-removal"')
    expect(read("scripts/Test-ConnectRemoval.ps1")).toContain("next build")
  })
})
