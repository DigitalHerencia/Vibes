import { UserProfile } from "@clerk/nextjs"

import { PageHero } from "@/components/blocks/page-hero"

export function SettingsFeature() {
  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow="Settings"
        title="Clerk owns account controls."
        description="Account management stays with the auth provider. App authorization remains local and row-backed."
      />
      <UserProfile routing="path" path="/settings" />
    </div>
  )
}
