import Link from "next/link"

import { PageHero } from "@/components/blocks/page-hero"
import { StatGrid } from "@/components/blocks/stat-grid"
import { ProjectCard } from "@/components/projects/project-card"
import { Button } from "@/components/ui/button"
import { getDashboardState } from "@/lib/fetchers/dashboardFetchers"

export async function DashboardFeature() {
  const state = await getDashboardState()

  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow="Tenant dashboard"
        title="Operational center."
        description="A protected RSC surface composed from fetchers and DTOs. No Prisma or authz logic lives in this feature."
      />
      <StatGrid
        stats={[
          { label: "Accessible projects", value: String(state.projectCount) },
          { label: "Auth model", value: "Clerk" },
          { label: "Authz model", value: "Rows" },
        ]}
      />
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-4xl">Recent projects</h2>
          <Button asChild size="sm">
            <Link href="/projects/new">New project</Link>
          </Button>
        </div>
        {state.empty ? (
          <div className="border bg-card p-6">
            <p className="text-muted-foreground">
              Create a project to exercise row-level ownership checks.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {state.recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
