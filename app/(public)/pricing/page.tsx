import { PageHero } from "@/components/blocks/page-hero"
import { ProcessPanel } from "@/components/blocks/process-panel"

export default function PricingPage() {
  return (
    <div className="grid gap-10">
      <PageHero
        eyebrow="Template economics"
        title="Bring your pricing model."
        description="The starter ships with product boundaries, not a billing product. Add Stripe or another provider under lib/providers when the business model is known."
      />
      <ProcessPanel
        title="Billing boundaries"
        steps={[
          {
            title: "No hidden billing",
            description:
              "No subscription, checkout, or invoice paths are generated until the app needs them.",
          },
          {
            title: "Provider isolated",
            description:
              "Payment SDK calls belong behind provider adapters, never in pages or components.",
          },
          {
            title: "State first",
            description:
              "Billing DTOs should expose safe status and references, not raw provider objects.",
          },
        ]}
      />
    </div>
  )
}
