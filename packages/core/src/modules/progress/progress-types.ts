import type { SessionId, JourneyId, UserId } from "../../shared/brand/index"
import type {
  RevisionComparison,
  WritingFeedback,
} from "../ai-feedback/ai-feedback-types"
import type { JourneySummary } from "../journeys/journey-types"
import type { JourneySessionDetail } from "../journeys/journey-types"

export type JourneyProgressStatus = "in_progress" | "completed"
export type SessionProgressStatus = "locked" | "in_progress" | "completed"
export type SessionAiStateStatus = "pending" | "succeeded" | "failed"
export type SessionAiStateKind = "feedback" | "comparison"

export type UserJourneyProgress = {
  readonly userId: UserId
  readonly journeyId: JourneyId
  readonly currentSessionOrder: number
  readonly completionRate: number
  readonly status: JourneyProgressStatus
}

export type UserJourneyListItem = JourneySummary & {
  readonly currentSessionOrder: number
  readonly completionRate: number
  readonly status: JourneyProgressStatus
}

export type StepResponse =
  | {
      readonly type: "MULTIPLE_CHOICE"
      readonly selected: string[]
    }
  | {
      readonly type: "FILL_IN_THE_BLANK"
      readonly selections: Record<string, string>
    }
  | {
      readonly type: "ORDERING"
      readonly order: string[]
    }
  | {
      readonly type: "HIGHLIGHT"
      readonly selected: string[]
    }
  | {
      readonly type: "SHORT_ANSWER"
      readonly text: string
    }
  | {
      readonly type: "WRITING"
      readonly text: string
    }
  | {
      readonly type: "REWRITING"
      readonly text: string
    }

export type StepResponseMap = Record<string, StepResponse>

export type UserSessionProgress = {
  readonly userId: UserId
  readonly sessionId: SessionId
  readonly currentStepOrder: number
  readonly status: SessionProgressStatus
  readonly stepResponsesJson: StepResponseMap
}

export type SessionAiResult = RevisionComparison | WritingFeedback
type UserSessionStepAiStateBase = {
  readonly userId: UserId
  readonly sessionId: SessionId
  readonly stepOrder: number
  readonly sourceStepOrder: number
  readonly status: SessionAiStateStatus
  readonly attemptCount: number
  readonly inputJson: Record<string, unknown>
  readonly errorMessage: string | null
  readonly updatedAt: string
}

export type UserSessionStepAiState =
  | (UserSessionStepAiStateBase & {
      readonly kind: "comparison"
      readonly resultJson: RevisionComparison | null
    })
  | (UserSessionStepAiStateBase & {
      readonly kind: "feedback"
      readonly resultJson: WritingFeedback | null
    })

type SessionStepAiStateBase = Omit<
  UserSessionStepAiStateBase,
  "inputJson" | "sessionId" | "userId"
>

export type SessionStepAiState =
  | (SessionStepAiStateBase & {
      readonly kind: "comparison"
      readonly resultJson: RevisionComparison | null
    })
  | (SessionStepAiStateBase & {
      readonly kind: "feedback"
      readonly resultJson: WritingFeedback | null
    })

export type SessionRuntime = JourneySessionDetail & {
  readonly currentStepOrder: number
  readonly status: SessionProgressStatus
  readonly stepResponsesJson: StepResponseMap
  readonly stepAiStates: SessionStepAiState[]
}
