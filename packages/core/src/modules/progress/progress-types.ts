import type { SessionId, JourneyId, UserId } from "../../shared/brand/index"
import type {
  RevisionComparison,
  WritingFeedback,
} from "../ai-feedback/ai-feedback-types"
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

export type UserSessionProgress = {
  readonly userId: UserId
  readonly sessionId: SessionId
  readonly currentStepOrder: number
  readonly status: SessionProgressStatus
  readonly stepResponsesJson: Record<string, unknown>
}

export type SessionAiResult = RevisionComparison | WritingFeedback

export type UserSessionStepAiState = {
  readonly userId: UserId
  readonly sessionId: SessionId
  readonly stepOrder: number
  readonly kind: SessionAiStateKind
  readonly sourceStepOrder: number
  readonly status: SessionAiStateStatus
  readonly attemptCount: number
  readonly inputJson: Record<string, unknown>
  readonly resultJson: SessionAiResult | null
  readonly errorMessage: string | null
  readonly updatedAt: string
}

export type SessionStepAiState = Omit<
  UserSessionStepAiState,
  "inputJson" | "sessionId" | "userId"
>

export type SessionRuntime = JourneySessionDetail & {
  readonly currentStepOrder: number
  readonly status: SessionProgressStatus
  readonly stepResponsesJson: Record<string, unknown>
  readonly stepAiStates: SessionStepAiState[]
}
