import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
  defaultValues?: {
    name?: string
    description?: string | null
  }
}

export function ProjectForm({ action, submitLabel, defaultValues }: ProjectFormProps) {
  return (
    <form action={action} className="grid gap-5 border bg-card p-6">
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
      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}
