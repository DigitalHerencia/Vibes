import { VouchCreationWizard } from "@/components/blocks/status"
import type { VouchCreationActionResult, VouchCreationDraft } from "@/components/blocks/status"

export interface StatusFeatureClientProps {
  initialDraft?: Partial<VouchCreationDraft>
  onSaveAmount: (draft: VouchCreationDraft) => Promise<VouchCreationActionResult>
  onSaveWindow: (draft: VouchCreationDraft) => Promise<VouchCreationActionResult>
  onCreateVouch: (draft: VouchCreationDraft) => Promise<VouchCreationActionResult>
}

export function StatusFeatureClient({
  initialDraft,
  onSaveAmount,
  onSaveWindow,
  onCreateVouch,
}: StatusFeatureClientProps) {
  return (
    <VouchCreationWizard
      initialDraft={initialDraft}
      onSaveAmount={onSaveAmount}
      onSaveWindow={onSaveWindow}
      onCreateVouch={onCreateVouch}
    />
  )
}
