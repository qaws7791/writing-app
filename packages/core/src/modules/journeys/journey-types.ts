import type { JourneyId, SessionId, StepId } from "../../shared/brand/index"

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

export type StepSummary = {
  readonly id: StepId
  readonly sessionId: SessionId
  readonly order: number
  readonly type: StepType
  readonly contentJson: unknown
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
