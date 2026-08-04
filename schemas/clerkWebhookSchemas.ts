import { z } from "zod"

const clerkEmailSchema = z.object({
  id: z.string().min(1).max(255).optional(),
  email_address: z.string().email().max(320).optional(),
})

export const clerkWebhookEnvelopeSchema = z.object({
  type: z.string().min(1).max(120),
  data: z.record(z.string(), z.unknown()),
})

const clerkUserDataSchema = z.object({
  id: z.string().min(1).max(255),
  email_addresses: z.array(clerkEmailSchema).optional(),
  primary_email_address_id: z.string().max(255).nullable().optional(),
  first_name: z.string().max(120).nullable().optional(),
  last_name: z.string().max(120).nullable().optional(),
  username: z.string().max(120).nullable().optional(),
  updated_at: z.number().int().nonnegative().max(8_640_000_000_000_000),
})

export const clerkUserWebhookSchema = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["user.created", "user.updated"]), data: clerkUserDataSchema }),
  z.object({
    type: z.literal("user.deleted"),
    data: z.object({ id: z.string().min(1).max(255) }),
  }),
])
