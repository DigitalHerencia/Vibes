import { Suspense } from "react"

import { ProjectsFeature } from "@/features/projects/projects-feature"
import { ProjectsSkeleton } from "@/features/projects/projects-skeleton"

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsFeature />
    </Suspense>
  )
}
