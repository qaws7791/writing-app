import { z } from "zod"

export const journeyCategorySchema = z.enum([
  "writing_skill",
  "mindfulness",
  "practical",
])

export const stepTypeValues = [
  "INTRO",
  "COMPLETION",
  "CONCEPT",
  "EXAMPLE",
  "MULTIPLE_CHOICE",
  "FILL_IN_THE_BLANK",
  "ORDERING",
  "HIGHLIGHT",
  "SHORT_ANSWER",
  "WRITING",
  "REWRITING",
  "AI_FEEDBACK",
  "AI_COMPARISON",
] as const

export const stepTypeSchema = z.enum(stepTypeValues)

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

export const sessionStepContentTypeSchema = stepTypeSchema

export const ctaConfigSchema = z
  .object({
    label: z.string(),
    variant: z.enum(["primary", "secondary"]),
  })
  .readonly()

export const introStepContentSchema = z
  .object({
    type: z.literal("INTRO"),
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).optional(),
    estimatedMinutes: z.number().int().nonnegative(),
  })
  .readonly()

export const completionStepContentSchema = z
  .object({
    type: z.literal("COMPLETION"),
    congratsMessage: z.string(),
    summaryPoints: z.array(z.string()),
    nextSessionPreview: z
      .object({
        title: z.string(),
        teaser: z.string(),
      })
      .optional(),
  })
  .readonly()

export const conceptStepContentSchema = z
  .object({
    type: z.literal("CONCEPT"),
    title: z.string(),
    body: z.string(),
    keyTakeaway: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .readonly()

export const exampleStepContentSchema = z
  .object({
    type: z.literal("EXAMPLE"),
    title: z.string(),
    examples: z.array(
      z
        .object({
          label: z.string().optional(),
          text: z.string(),
          highlights: z
            .array(
              z
                .object({
                  startOffset: z.number().int().nonnegative(),
                  endOffset: z.number().int().nonnegative(),
                  comment: z.string(),
                })
                .readonly()
            )
            .optional(),
        })
        .readonly()
    ),
    commentary: z.string().optional(),
  })
  .readonly()

export const multipleChoiceStepContentSchema = z
  .object({
    type: z.literal("MULTIPLE_CHOICE"),
    question: z.string(),
    passage: z.string().optional(),
    options: z.array(
      z
        .object({
          id: z.string(),
          text: z.string(),
        })
        .readonly()
    ),
    correctOptionIds: z.array(z.string()),
    multiSelect: z.boolean(),
    explanations: z.record(z.string(), z.string()),
  })
  .readonly()

export const fillInTheBlankStepContentSchema = z
  .object({
    type: z.literal("FILL_IN_THE_BLANK"),
    instruction: z.string(),
    sentence: z.string(),
    blanks: z.array(
      z
        .object({
          id: z.string(),
          options: z.array(
            z
              .object({
                id: z.string(),
                text: z.string(),
              })
              .readonly()
          ),
          correctOptionId: z.string(),
        })
        .readonly()
    ),
    explanation: z.string(),
  })
  .readonly()

export const orderingStepContentSchema = z
  .object({
    type: z.literal("ORDERING"),
    instruction: z.string(),
    items: z.array(
      z
        .object({
          id: z.string(),
          text: z.string(),
        })
        .readonly()
    ),
    correctOrder: z.array(z.string()),
    explanation: z.string(),
  })
  .readonly()

export const highlightStepContentSchema = z
  .object({
    type: z.literal("HIGHLIGHT"),
    instruction: z.string(),
    passage: z.string(),
    selectableRanges: z.array(
      z
        .object({
          id: z.string(),
          startOffset: z.number().int().nonnegative(),
          endOffset: z.number().int().nonnegative(),
        })
        .readonly()
    ),
    correctRangeIds: z.array(z.string()),
    explanations: z.record(z.string(), z.string()),
  })
  .readonly()

export const shortAnswerStepContentSchema = z
  .object({
    type: z.literal("SHORT_ANSWER"),
    question: z.string(),
    context: z.string().optional(),
    placeholder: z.string().optional(),
    minLength: z.number().int().nonnegative(),
    maxLength: z.number().int().positive(),
  })
  .readonly()

export const writingStepContentSchema = z
  .object({
    type: z.literal("WRITING"),
    prompt: z.string(),
    guideline: z.string().optional(),
    minLength: z.number().int().nonnegative(),
    recommendedLength: z.number().int().nonnegative(),
    timeLimitSeconds: z.number().int().nonnegative(),
  })
  .readonly()

export const rewritingStepContentSchema = z
  .object({
    type: z.literal("REWRITING"),
    instruction: z.string(),
    originalWritingStepId: z.string(),
    feedbackStepId: z.string(),
  })
  .readonly()

export const aiFeedbackStepContentSchema = z
  .object({
    type: z.literal("AI_FEEDBACK"),
    targetStepId: z.string(),
    loadingMessage: z.string(),
  })
  .readonly()

export const aiComparisonStepContentSchema = z
  .object({
    type: z.literal("AI_COMPARISON"),
    originalStepId: z.string(),
    rewritingStepId: z.string(),
    loadingMessage: z.string(),
  })
  .readonly()

export const sessionStepContentSchema = z.discriminatedUnion("type", [
  introStepContentSchema,
  completionStepContentSchema,
  conceptStepContentSchema,
  exampleStepContentSchema,
  multipleChoiceStepContentSchema,
  fillInTheBlankStepContentSchema,
  orderingStepContentSchema,
  highlightStepContentSchema,
  shortAnswerStepContentSchema,
  writingStepContentSchema,
  rewritingStepContentSchema,
  aiFeedbackStepContentSchema,
  aiComparisonStepContentSchema,
])

export const sessionStepPayloadSchema = z
  .object({
    type: sessionStepContentTypeSchema.optional(),
    content: sessionStepContentSchema,
    cta: ctaConfigSchema,
  })
  .superRefine((value, ctx) => {
    if (value.type && value.type !== value.content.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "step payload type과 content.type이 일치해야 합니다.",
        path: ["type"],
      })
    }
  })
  .readonly()

export const createStepBodySchema = z
  .object({
    type: stepTypeSchema,
    order: z.number().int().min(1),
    contentJson: sessionStepPayloadSchema,
  })
  .superRefine((value, ctx) => {
    if (value.type !== value.contentJson.content.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "스텝 타입과 콘텐츠 타입이 일치해야 합니다.",
        path: ["type"],
      })
    }
  })

export const updateStepBodySchema = z
  .object({
    type: stepTypeSchema.optional(),
    order: z.number().int().min(1).optional(),
    contentJson: sessionStepPayloadSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasType = value.type !== undefined
    const hasContentJson = value.contentJson !== undefined

    if (hasType !== hasContentJson) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "스텝 타입과 콘텐츠는 함께 수정해야 합니다.",
        path: hasType ? ["contentJson"] : ["type"],
      })
      return
    }

    if (
      value.type !== undefined &&
      value.contentJson !== undefined &&
      value.type !== value.contentJson.content.type
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "스텝 타입과 콘텐츠 타입이 일치해야 합니다.",
        path: ["type"],
      })
    }
  })

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
    contentJson: sessionStepPayloadSchema,
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
