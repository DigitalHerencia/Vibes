import "server-only"

import { actionFailure, type ActionResult } from "@/types/actionResultTypes"

export class ExpectedActionError extends Error {
  constructor(
    readonly code: string,
    readonly publicMessage: string
  ) {
    super(publicMessage)
    this.name = "ExpectedActionError"
  }
}

export function expectedActionFailure(error: unknown): ActionResult<never> {
  if (!(error instanceof ExpectedActionError)) throw error
  return actionFailure(error.code, error.publicMessage)
}
