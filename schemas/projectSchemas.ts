import { z } from "zod"

export const projectIdSchema = z.string().trim().min(1)

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
})

export const updateProjectSchema = createProjectSchema.extend({
  projectId: projectIdSchema,
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
