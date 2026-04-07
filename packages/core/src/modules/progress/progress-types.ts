import type { UserId, JourneyId, SessionId } from "../../shared/brand/index"

export type JourneyProgressStatus = "in_progress" | "completed"
export type SessionProgressStatus = "locked" | "in_progress" | "completed"

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
