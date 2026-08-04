import { PageHero } from "@/components/blocks/page-hero"
import { ProjectForm } from "@/components/projects/project-form"
import { createProjectAction } from "@/lib/actions/projectActions"

export function NewProjectFeature() {
  async function createAction(formData: FormData) {
    "use server"

    await createProjectAction(formData)
  }

  return (
    <div className="grid max-w-3xl gap-8">
      <PageHero
        eyebrow="Create project"
        title="Start with ownership."
        description="The transaction creates a project inside your active organization and records an audit event."
      />
      <ProjectForm action={createAction} submitLabel="Create project" />
    </div>
  )
}
