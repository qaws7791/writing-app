import { z } from "zod"

export const adminAuditCategorySchema = z.enum([
  "privacy-access",
  "identity-mutation",
  "content-mutation",
])

export const adminAuditActionSchema = z.enum([
  "learner.detail.read",
  "learner.status.suspend",
  "learner.status.activate",
  "learner.delete",
  "course.publish",
  "course.archive",
])

export const adminAuditOutcomeSchema = z.enum([
  "started",
  "succeeded",
  "failed",
])

export const adminAuditEventDtoSchema = z
  .object({
    action: adminAuditActionSchema,
    actorId: z.string().min(1),
    category: adminAuditCategorySchema,
    clientIp: z.string().nullable(),
    createdAt: z.iso.datetime(),
    id: z.string().min(1),
    outcome: adminAuditOutcomeSchema,
    requestId: z.string().min(1),
    retentionUntil: z.iso.datetime(),
    target: z.discriminatedUnion("type", [
      z.object({ id: z.string().min(1), type: z.literal("learner") }).strict(),
      z.object({ id: z.string().min(1), type: z.literal("course") }).strict(),
    ]),
  })
  .strict()

export const adminAuditEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const adminAuditEventsDtoSchema = z
  .object({
    items: z.array(adminAuditEventDtoSchema),
  })
  .strict()

export type AdminAuditEventDto = z.infer<typeof adminAuditEventDtoSchema>
export type AdminAuditEventsDto = z.infer<typeof adminAuditEventsDtoSchema>
