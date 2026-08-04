import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHero } from "@/components/blocks/page-hero"
import { ProjectForm } from "@/components/projects/project-form"
import { updateProjectAction } from "@/lib/actions/projectActions"
import { getProjectDetailState } from "@/lib/fetchers/projectFetchers"

type ProjectDetailFeatureProps = {
  projectId: string
}

export async function ProjectDetailFeature({ projectId }: ProjectDetailFeatureProps) {
  const project = await getProjectDetailState(projectId)
  const updateAction = updateProjectAction.bind(null, project.id)

  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow={project.role}
        title={project.name}
        description={project.description ?? "This project has no description."}
      />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ProjectForm
          action={updateAction}
          submitLabel="Save project"
          defaultValues={{ name: project.name, description: project.description }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {project.memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between border p-3">
                <div>
                  <p>{membership.displayName ?? membership.email ?? membership.userId}</p>
                  <p className="text-xs text-muted-foreground">{membership.userId}</p>
                </div>
                <Badge>{membership.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
