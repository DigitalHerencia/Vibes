import {
  vouchPreviewDocument,
  vouchPreviewInitialDraft,
  vouchPreviewTimeline,
} from "@/reference-implementations/vouch/presentation-fixtures"
import { vouchPresentationContent } from "@/reference-implementations/vouch/presentation-content"
import {
  VouchCountdown,
  VouchStatusBadge,
  VouchStatusDocument,
  VouchStatusTimeline,
} from "@/components/blocks/status"
import { StatusFeatureClient } from "@/components/blocks/statusFeatureClient"

export function StatusFeature() {
  return (
    <main className="p-8 md:p-12">
      <section className="grid gap-8 md:gap-16">
        <header className="max-w-3xl">
          <p className="text-[11px] font-black tracking-widest text-blue-600 uppercase">
            {vouchPresentationContent.page.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl leading-none font-black tracking-wide uppercase md:text-6xl">
            {vouchPresentationContent.page.title}
          </h1>
          <p className="mt-4 text-sm leading-6 font-semibold text-neutral-400 md:text-base">
            {vouchPresentationContent.page.description}
          </p>
        </header>

        <StatusFeatureClient initialDraft={vouchPreviewInitialDraft} />

        <VouchStatusDocument data={vouchPreviewDocument} />
        <VouchStatusTimeline items={vouchPreviewTimeline} />
        {vouchPreviewDocument.countdown ? (
          <VouchCountdown {...vouchPreviewDocument.countdown} />
        ) : null}
        <div>
          <VouchStatusBadge
            status={vouchPreviewDocument.status}
            tone={vouchPreviewDocument.statusTone ?? "pending"}
          />
        </div>
      </section>
    </main>
  )
}
