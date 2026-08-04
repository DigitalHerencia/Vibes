import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ProjectSummaryDTO } from "@/types/projectTypes"

type ProjectCardProps = {
  project: ProjectSummaryDTO
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a
      href={`/projects/${project.id}`}
      className="block border bg-card p-5 no-underline hover:border-primary"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge>{project.role}</Badge>
          <h3>{project.name}</h3>
          <p className="text-sm text-muted-foreground">
            {project.description ?? "No description has been set."}
          </p>
        </div>
        <ArrowRight className="mt-1 size-5 text-primary" />
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Updated {project.updatedAt}</p>
    </a>
  )
}
