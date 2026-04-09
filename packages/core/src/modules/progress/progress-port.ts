import type { UserId, JourneyId, SessionId } from "../../shared/brand/index"
import type {
  SessionAiStateKind,
  SessionAiStateStatus,
  JourneyProgressStatus,
  SessionProgressStatus,
  UserJourneyProgress,
  UserSessionProgress,
  UserSessionStepAiState,
} from "./progress-types"

export interface ProgressRepository {
  getJourneyProgress(
    userId: UserId,
    journeyId: JourneyId
  ): Promise<UserJourneyProgress | null>

  listActiveJourneys(userId: UserId): Promise<UserJourneyProgress[]>

  listCompletedJourneys(userId: UserId): Promise<UserJourneyProgress[]>

  enrollJourney(
    userId: UserId,
    journeyId: JourneyId
  ): Promise<UserJourneyProgress>

  updateJourneyProgress(
    userId: UserId,
    journeyId: JourneyId,
    update: {
      currentSessionOrder?: number
      completionRate?: number
      status?: JourneyProgressStatus
    }
  ): Promise<void>

  initSessionProgressForJourney(
    userId: UserId,
    journeyId: JourneyId
  ): Promise<void>

  getSessionProgress(
    userId: UserId,
    sessionId: SessionId
  ): Promise<UserSessionProgress | null>

  startSession(
    userId: UserId,
    sessionId: SessionId
  ): Promise<UserSessionProgress>

  updateSessionProgress(
    userId: UserId,
    sessionId: SessionId,
    update: {
      currentStepOrder?: number
      status?: SessionProgressStatus
      stepResponsesJson?: Record<string, unknown>
    }
  ): Promise<void>

  getSessionStepAiState(
    userId: UserId,
    sessionId: SessionId,
    stepOrder: number
  ): Promise<UserSessionStepAiState | null>

  listSessionStepAiStates(
    userId: UserId,
    sessionId: SessionId
  ): Promise<UserSessionStepAiState[]>

  listPendingSessionStepAiStates(
    limit: number
  ): Promise<UserSessionStepAiState[]>

  saveSessionStepAiState(
    userId: UserId,
    sessionId: SessionId,
    stepOrder: number,
    state: {
      kind: SessionAiStateKind
      sourceStepOrder: number
      status: SessionAiStateStatus
      attemptCount: number
      inputJson: Record<string, unknown>
      resultJson: Record<string, unknown> | null
      errorMessage: string | null
    }
  ): Promise<void>
}
