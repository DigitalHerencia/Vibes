"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProjectActionState } from "@/types/projectTypes"

type ProjectFormProps = {
  action: (previousState: ProjectActionState, formData: FormData) => Promise<ProjectActionState>
  submitLabel: string
  defaultValues?: {
    name?: string
    description?: string | null
  }
}

export function ProjectForm({ action, submitLabel, defaultValues }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="grid gap-5 border bg-card p-6">
      <Field>
        <Label htmlFor="name">Project name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required maxLength={120} />
      </Field>
      <Field>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          maxLength={500}
        />
      </Field>
      {state && !state.ok && state.formError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
