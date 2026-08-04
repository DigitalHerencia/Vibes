import { Suspense } from "react"

import { ProjectDetailFeature } from "@/features/projects/project-detail-feature"
import { ProjectsSkeleton } from "@/features/projects/projects-skeleton"

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectDetailFeature projectId={projectId} />
    </Suspense>
  )
}
