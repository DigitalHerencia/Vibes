"use server"

import {
  createBillingPortalSessionWorkflow,
  createCheckoutSessionWorkflow,
} from "@/lib/billing/workflows/billingWorkflows"
import { actionFailure, actionSuccess, type ActionResult } from "@/types/actionResultTypes"

export async function createCheckoutSessionAction(): Promise<ActionResult<{ url: string }>> {
  try {
    return actionSuccess(await createCheckoutSessionWorkflow())
  } catch {
    return actionFailure("BILLING_UNAVAILABLE", "Unable to start hosted Checkout.")
  }
}

export async function createBillingPortalSessionAction(): Promise<ActionResult<{ url: string }>> {
  try {
    return actionSuccess(await createBillingPortalSessionWorkflow())
  } catch {
    return actionFailure("BILLING_UNAVAILABLE", "Unable to open the billing portal.")
  }
}
