"use client"

import {
  createStatusPreviewVouch,
  saveStatusPreviewAmount,
  saveStatusPreviewWindow,
} from "@/components/(presentation)/presentationOperations"
import { VouchCreationWizard } from "@/components/blocks/status"
import type { VouchCreationDraft } from "@/types/presentationPreviewTypes"

export interface StatusFeatureClientProps {
  initialDraft?: Partial<VouchCreationDraft>
}

export function StatusFeatureClient({ initialDraft }: StatusFeatureClientProps) {
  return (
    <VouchCreationWizard
      initialDraft={initialDraft}
      onSaveAmount={saveStatusPreviewAmount}
      onSaveWindow={saveStatusPreviewWindow}
      onCreateVouch={createStatusPreviewVouch}
    />
  )
}
