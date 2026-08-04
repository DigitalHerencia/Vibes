import { Suspense } from "react"

import { DashboardFeature } from "@/features/dashboard/dashboard-feature"
import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardFeature />
    </Suspense>
  )
}
