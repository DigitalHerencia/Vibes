import { afterEach, describe, expect, it } from "vitest"

import { deriveConnectPaymentTerms } from "@/lib/connect/policy"

const originalCurrency = process.env.STRIPE_CONNECT_CURRENCY
const originalFee = process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS

afterEach(() => {
  if (originalCurrency === undefined) delete process.env.STRIPE_CONNECT_CURRENCY
  else process.env.STRIPE_CONNECT_CURRENCY = originalCurrency
  if (originalFee === undefined) delete process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS
  else process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS = originalFee
})

describe("Connect money policy", () => {
  it("derives currency and integer fee from server configuration", () => {
    process.env.STRIPE_CONNECT_CURRENCY = "USD"
    process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS = "750"
    expect(deriveConnectPaymentTerms({ reference: "order_1", amountMinor: 10_01 })).toEqual({
      reference: "order_1",
      amountMinor: 10_01,
      currency: "usd",
      platformFeeMinor: 75,
    })
  })

  it("rejects fractional, invalid, and client-like money values", () => {
    process.env.STRIPE_CONNECT_CURRENCY = "usd"
    process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS = "100"
    expect(() => deriveConnectPaymentTerms({ reference: "order", amountMinor: 1.5 })).toThrow(
      /integer minor-unit/
    )
    process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS = "10000"
    expect(() => deriveConnectPaymentTerms({ reference: "order", amountMinor: 100 })).toThrow(
      /supported range/
    )
  })
})
