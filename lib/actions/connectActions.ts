"use server"

import {
  captureConnectPaymentWorkflow,
  createConnectOnboardingLinkWorkflow,
  refundConnectPaymentWorkflow,
} from "@/lib/connect/workflows/connectWorkflows"
import { connectResourceIdSchema } from "@/schemas/connectSchemas"
import { actionFailure, actionSuccess, type ActionResult } from "@/types/actionResultTypes"

export async function createConnectOnboardingLinkAction(): Promise<ActionResult<{ url: string }>> {
  try {
    return actionSuccess(await createConnectOnboardingLinkWorkflow())
  } catch {
    return actionFailure("CONNECT_UNAVAILABLE", "Unable to start connected-account onboarding.")
  }
}

export async function captureConnectPaymentAction(
  paymentId: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const payment = await captureConnectPaymentWorkflow(connectResourceIdSchema.parse(paymentId))
    return actionSuccess({ status: payment.status })
  } catch {
    return actionFailure("CONNECT_CAPTURE_FAILED", "Unable to capture this payment.")
  }
}

export async function refundConnectPaymentAction(
  paymentId: string
): Promise<ActionResult<{ refundedAmountMinor: number }>> {
  try {
    const payment = await refundConnectPaymentWorkflow(connectResourceIdSchema.parse(paymentId))
    return actionSuccess({ refundedAmountMinor: payment.refundedAmountMinor })
  } catch {
    return actionFailure("CONNECT_REFUND_FAILED", "Unable to refund this payment.")
  }
}
