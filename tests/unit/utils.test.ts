import { describe, expect, it } from "vitest"

import { safeHref } from "@/lib/utils"

describe("safeHref", () => {
  it("accepts relative application paths and HTTPS URLs", () => {
    expect(safeHref("/pricing")).toBe("/pricing")
    expect(safeHref("#details")).toBe("#details")
    expect(safeHref("https://example.com/docs")).toBe("https://example.com/docs")
  })

  it("rejects executable and protocol-relative URLs", () => {
    expect(() => safeHref("javascript:alert(1)")).toThrow(TypeError)
    expect(() => safeHref("//attacker.example/path")).toThrow(TypeError)
  })
})
