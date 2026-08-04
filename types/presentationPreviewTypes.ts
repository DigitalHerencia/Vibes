export type VouchCreationDraft = {
  amountDollars: string
  appointmentStartsAt: string
  confirmationOpensAt: string
  confirmationExpiresAt: string
  disclaimerAccepted: boolean
}

export type VouchCreationActionResult =
  | {
      ok: true
      data?: VouchCreationPreviewData
    }
  | {
      ok: false
      formError?: string
      fieldErrors?: Record<string, string[]>
    }

export type VouchCreationPreviewData = {
  amountCents?: number
  customerTotalCents?: number
  vouchServiceFeeCents?: number
  processingFeeOffsetCents?: number
  detailPath?: string
  checkoutUrl?: string
}
