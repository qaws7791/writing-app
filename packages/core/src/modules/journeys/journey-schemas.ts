import { z } from "zod"

export const journeyCategorySchema = z.enum([
  "writing_skill",
  "mindfulness",
  "practical",
])

export const stepTypeSchema = z.enum([
  "learn",
  "read",
  "guided_question",
  "write",
  "feedback",
  "revise",
])

export const journeyIdParamSchema = z.coerce.number().int().positive()
export const sessionIdParamSchema = z.coerce.number().int().positive()
export const stepIdParamSchema = z.coerce.number().int().positive()

export const createJourneyBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: journeyCategorySchema,
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const updateJourneyBodySchema = createJourneyBodySchema.partial()

export const createSessionBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  order: z.number().int().min(1),
})

export const updateSessionBodySchema = createSessionBodySchema.partial()

export const createStepBodySchema = z.object({
  type: stepTypeSchema,
  order: z.number().int().min(1),
  contentJson: z.unknown(),
})

export const updateStepBodySchema = createStepBodySchema.partial()

const journeySummaryBase = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  category: journeyCategorySchema,
  thumbnailUrl: z.string().nullable(),
  sessionCount: z.number().int(),
})

export const journeySummarySchema = journeySummaryBase.readonly()

const journeySessionSummaryBase = z.object({
  id: z.number().int(),
  journeyId: z.number().int(),
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().int(),
})

export const journeySessionSummarySchema = journeySessionSummaryBase.readonly()

export const stepSummarySchema = z
  .object({
    id: z.number().int(),
    sessionId: z.number().int(),
    order: z.number().int(),
    type: stepTypeSchema,
    contentJson: z.unknown(),
  })
  .readonly()

export const journeyDetailSchema = journeySummaryBase
  .extend({
    sessions: z.array(journeySessionSummarySchema),
  })
  .readonly()

export const journeyProgressSchema = z
  .object({
    currentSessionOrder: z.number().int(),
    completionRate: z.number(),
    status: z.enum(["in_progress", "completed"]),
  })
  .nullable()

export const journeyDetailWithProgressSchema = journeySummaryBase
  .extend({
    sessions: z.array(journeySessionSummarySchema),
    progress: journeyProgressSchema,
  })
  .readonly()

export const journeySessionDetailSchema = journeySessionSummaryBase
  .extend({
    steps: z.array(stepSummarySchema),
  })
  .readonly()

export const journeyListResponseSchema = z.object({
  items: z.array(journeySummarySchema),
})

export const journeyStatusSchema = z.enum(["all", "in_progress", "completed"])

export const journeyFiltersQuerySchema = z.object({
  category: journeyCategorySchema.optional(),
  status: journeyStatusSchema.optional(),
})
