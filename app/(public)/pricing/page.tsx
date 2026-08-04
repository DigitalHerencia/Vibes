import { PageHero } from "@/components/blocks/page-hero"
import { ProcessPanel } from "@/components/blocks/process-panel"

export default function PricingPage() {
  return (
    <div className="grid gap-10">
      <PageHero
        eyebrow="Template economics"
        title="Bring your pricing model."
        description="The starter includes a tenant-owned Stripe subscription foundation for one server-configured recurring plan."
      />
      <ProcessPanel
        title="Billing boundaries"
        steps={[
          {
            title: "Hosted billing",
            description: "Checkout and subscription management stay on Stripe-hosted surfaces.",
          },
          {
            title: "Provider isolated",
            description:
              "Stripe SDK calls stay behind provider adapters, never in pages or components.",
          },
          {
            title: "State first",
            description:
              "Verified webhooks normalize local subscription and entitlement state; redirects grant nothing.",
          },
        ]}
      />
    </div>
  )
}
