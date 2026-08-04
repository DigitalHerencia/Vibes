"use server"

import {
  createBillingPortalSessionWorkflow,
  createCheckoutSessionWorkflow,
} from "@/lib/billing/workflows/billingWorkflows"
import { expectedActionFailure } from "@/lib/errors/expectedActionError"
import { actionSuccess, type ActionResult } from "@/types/actionResultTypes"

export async function createCheckoutSessionAction(): Promise<ActionResult<{ url: string }>> {
  try {
    return actionSuccess(await createCheckoutSessionWorkflow())
  } catch (error) {
    return expectedActionFailure(error)
  }
}

export async function createBillingPortalSessionAction(): Promise<ActionResult<{ url: string }>> {
  try {
    return actionSuccess(await createBillingPortalSessionWorkflow())
  } catch (error) {
    return expectedActionFailure(error)
  }
}
