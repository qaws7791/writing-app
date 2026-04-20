import type { z } from "zod"

import type { JourneyId, SessionId, StepId } from "../../shared/brand/index"
import type {
  aiComparisonStepContentSchema,
  aiFeedbackStepContentSchema,
  completionStepContentSchema,
  conceptStepContentSchema,
  ctaConfigSchema,
  exampleStepContentSchema,
  fillInTheBlankStepContentSchema,
  highlightStepContentSchema,
  introStepContentSchema,
  multipleChoiceStepContentSchema,
  orderingStepContentSchema,
  rewritingStepContentSchema,
  sessionStepContentSchema,
  sessionStepContentTypeSchema,
  sessionStepPayloadSchema,
  shortAnswerStepContentSchema,
  writingStepContentSchema,
} from "./journey-schemas"

export type JourneyCategory = "writing_skill" | "mindfulness" | "practical"

export type StepType =
  | "learn"
  | "read"
  | "guided_question"
  | "write"
  | "feedback"
  | "revise"

export type CreateJourneyInput = {
  readonly title: string
  readonly description: string
  readonly category: JourneyCategory
  readonly thumbnailUrl?: string | null
}

export type UpdateJourneyInput = Partial<CreateJourneyInput>

export type CreateSessionInput = {
  readonly title: string
  readonly description: string
  readonly estimatedMinutes: number
  readonly order: number
}

export type UpdateSessionInput = Partial<CreateSessionInput>

export type CreateStepInput = {
  readonly type: StepType
  readonly order: number
  readonly contentJson: unknown
}

export type UpdateStepInput = Partial<CreateStepInput>

export type JourneySummary = {
  readonly id: JourneyId
  readonly title: string
  readonly description: string
  readonly category: JourneyCategory
  readonly thumbnailUrl: string | null
  readonly sessionCount: number
}

export type JourneySessionSummary = {
  readonly id: SessionId
  readonly journeyId: JourneyId
  readonly order: number
  readonly title: string
  readonly description: string
  readonly estimatedMinutes: number
}

export type SessionStepContentType = z.infer<
  typeof sessionStepContentTypeSchema
>
export type CTAConfig = z.infer<typeof ctaConfigSchema>
export type IntroStepContent = z.infer<typeof introStepContentSchema>
export type CompletionStepContent = z.infer<typeof completionStepContentSchema>
export type ConceptStepContent = z.infer<typeof conceptStepContentSchema>
export type ExampleStepContent = z.infer<typeof exampleStepContentSchema>
export type MultipleChoiceStepContent = z.infer<
  typeof multipleChoiceStepContentSchema
>
export type FillInTheBlankStepContent = z.infer<
  typeof fillInTheBlankStepContentSchema
>
export type OrderingStepContent = z.infer<typeof orderingStepContentSchema>
export type HighlightStepContent = z.infer<typeof highlightStepContentSchema>
export type ShortAnswerStepContent = z.infer<
  typeof shortAnswerStepContentSchema
>
export type WritingStepContent = z.infer<typeof writingStepContentSchema>
export type RewritingStepContent = z.infer<typeof rewritingStepContentSchema>
export type AIFeedbackStepContent = z.infer<typeof aiFeedbackStepContentSchema>
export type AIComparisonStepContent = z.infer<
  typeof aiComparisonStepContentSchema
>
export type SessionStepContent = z.infer<typeof sessionStepContentSchema>
export type SessionStepPayload = z.infer<typeof sessionStepPayloadSchema>

export type StepSummary = {
  readonly id: StepId
  readonly sessionId: SessionId
  readonly order: number
  readonly type: StepType
  readonly contentJson: SessionStepPayload
}

export type JourneyDetail = JourneySummary & {
  readonly sessions: JourneySessionSummary[]
}

export type JourneyFullDetail = JourneySummary & {
  readonly sessions: readonly JourneySessionDetail[]
}

export type JourneyDetailWithProgress = JourneyDetail & {
  readonly progress: {
    readonly currentSessionOrder: number
    readonly completionRate: number
    readonly status: "in_progress" | "completed"
  } | null
}

export type JourneySessionDetail = JourneySessionSummary & {
  readonly steps: StepSummary[]
}
