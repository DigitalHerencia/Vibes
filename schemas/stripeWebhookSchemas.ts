import { z } from "zod"

export const stripeWebhookEnvelopeSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.string().min(1).max(120),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
})

export const stripeSubscriptionTriggerSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.enum([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ]),
  data: z.object({
    object: z.object({ id: z.string().min(1).max(255) }),
  }),
})

export const stripeSubscriptionSnapshotSchema = z.object({
  id: z.string().min(1).max(255),
  customer: z.string().min(1).max(255),
  status: z.string().min(1).max(40),
  cancel_at_period_end: z.boolean(),
  created: z.number().int().nonnegative(),
  items: z.object({
    data: z
      .array(
        z.object({
          id: z.string().min(1).max(255),
          quantity: z.number().int().positive().nullable(),
          current_period_end: z.number().int().nonnegative(),
          price: z.object({ id: z.string().min(1).max(255) }),
        })
      )
      .length(1),
  }),
})
