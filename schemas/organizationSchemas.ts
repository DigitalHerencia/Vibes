import { z } from "zod"

const organizationRoleSchema = z.enum(["owner", "admin", "member", "viewer"])
const invitationRoleSchema = z.enum(["admin", "member", "viewer"])

export const createOrganizationSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  })
  .strict()

export const inviteOrganizationMemberSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    role: invitationRoleSchema,
  })
  .strict()

export const updateMembershipSchema = z
  .object({
    membershipId: z.string().trim().min(1),
    role: organizationRoleSchema.nullable(),
  })
  .strict()

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type InviteOrganizationMemberInput = z.infer<typeof inviteOrganizationMemberSchema>
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>
