"use server"

import {
  captureConnectPaymentWorkflow,
  createConnectOnboardingLinkWorkflow,
  refundConnectPaymentWorkflow,
} from "@/lib/connect/workflows/connectWorkflows"
import { expectedActionFailure } from "@/lib/errors/expectedActionError"
import { connectResourceIdSchema } from "@/schemas/connectSchemas"
import { actionFailure, actionSuccess, type ActionResult } from "@/types/actionResultTypes"

export async function createConnectOnboardingLinkAction(): Promise<ActionResult<{ url: string }>> {
  try {
    return actionSuccess(await createConnectOnboardingLinkWorkflow())
  } catch (error) {
    return expectedActionFailure(error)
  }
}

export async function captureConnectPaymentAction(
  paymentId: string
): Promise<ActionResult<{ status: string }>> {
  const parsed = connectResourceIdSchema.safeParse(paymentId)
  if (!parsed.success) return actionFailure("INVALID_INPUT", "Invalid payment reference.")
  try {
    const payment = await captureConnectPaymentWorkflow(parsed.data)
    return actionSuccess({ status: payment.status })
  } catch (error) {
    return expectedActionFailure(error)
  }
}

export async function refundConnectPaymentAction(
  paymentId: string
): Promise<ActionResult<{ refundedAmountMinor: number }>> {
  const parsed = connectResourceIdSchema.safeParse(paymentId)
  if (!parsed.success) return actionFailure("INVALID_INPUT", "Invalid payment reference.")
  try {
    const payment = await refundConnectPaymentWorkflow(parsed.data)
    return actionSuccess({ refundedAmountMinor: payment.refundedAmountMinor })
  } catch (error) {
    return expectedActionFailure(error)
  }
}
