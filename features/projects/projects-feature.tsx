import Link from "next/link"

import { PageHero } from "@/components/blocks/page-hero"
import { ProjectCard } from "@/components/projects/project-card"
import { Button } from "@/components/ui/button"
import { getProjectListState } from "@/lib/fetchers/projectFetchers"

export async function ProjectsFeature() {
  const state = await getProjectListState()

  return (
    <div className="grid gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <PageHero
          eyebrow="Projects"
          title="Rows decide access."
          description="Every card is returned by a protected fetcher that filters through local membership rows."
          className="py-0"
        />
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>
      {state.empty ? (
        <div className="border bg-card p-6">
          <p className="text-muted-foreground">No projects are available to this user yet.</p>
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {state.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      )}
    </div>
  )
}
