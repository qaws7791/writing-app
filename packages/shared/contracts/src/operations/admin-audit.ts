import { z } from "zod"

import {
  nonNegativeIntegerSchema,
  positiveIntegerSchema,
} from "#contracts/shared/integer"

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
  "course.restore",
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

/** 기간은 플랫폼 날짜 경계를 따르는 논리 날짜이며 `from`과 `to` 모두 포함이다. */
export const adminAuditEventsQuerySchema = z.object({
  category: adminAuditCategorySchema.optional(),
  from: z.iso.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  to: z.iso.date().optional(),
})

export const adminAuditEventsDtoSchema = z
  .object({
    items: z.array(adminAuditEventDtoSchema),
    pagination: z.strictObject({
      page: positiveIntegerSchema,
      pageSize: positiveIntegerSchema,
      totalItems: nonNegativeIntegerSchema,
      totalPages: positiveIntegerSchema,
    }),
  })
  .strict()

export type AdminAuditCategory = z.infer<typeof adminAuditCategorySchema>
export type AdminAuditEventDto = z.infer<typeof adminAuditEventDtoSchema>
export type AdminAuditEventsDto = z.infer<typeof adminAuditEventsDtoSchema>
