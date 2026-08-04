import { describe, expect, it } from "vitest"

import { ExpectedActionError, expectedActionFailure } from "@/lib/errors/expectedActionError"

describe("expected Server Action errors", () => {
  it("maps an explicitly public workflow error to ActionResult", () => {
    expect(
      expectedActionFailure(new ExpectedActionError("RESOURCE_STATE", "Try a different state."))
    ).toEqual({ ok: false, code: "RESOURCE_STATE", formError: "Try a different state." })
  })

  it("rethrows unexpected failures instead of swallowing them", () => {
    const unexpected = new Error("database unavailable")
    expect(() => expectedActionFailure(unexpected)).toThrow(unexpected)
  })
})
