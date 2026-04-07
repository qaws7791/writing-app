import type { UserId, JourneyId, SessionId } from "../../shared/brand/index"
import type {
  JourneyProgressStatus,
  SessionProgressStatus,
  UserJourneyProgress,
  UserSessionProgress,
} from "./progress-types"

export interface ProgressRepository {
  getJourneyProgress(
    userId: UserId,
    journeyId: JourneyId
  ): Promise<UserJourneyProgress | null>

  listActiveJourneys(userId: UserId): Promise<UserJourneyProgress[]>

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
}
