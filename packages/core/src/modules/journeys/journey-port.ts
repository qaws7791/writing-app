import type { JourneyId, SessionId, StepId } from "../../shared/brand/index"
import type {
  CreateJourneyInput,
  CreateSessionInput,
  CreateStepInput,
  JourneyCategory,
  JourneyDetail,
  JourneyFullDetail,
  JourneySessionDetail,
  JourneySessionSummary,
  JourneySummary,
  StepSummary,
  UpdateJourneyInput,
  UpdateSessionInput,
  UpdateStepInput,
} from "./journey-types"

export interface JourneyRepository {
  list(filters?: { category?: JourneyCategory }): Promise<JourneySummary[]>
  getById(journeyId: JourneyId): Promise<JourneyDetail | null>
  getByIdFull(journeyId: JourneyId): Promise<JourneyFullDetail | null>
  getSessionDetail(sessionId: SessionId): Promise<JourneySessionDetail | null>
  listSessions(journeyId: JourneyId): Promise<JourneySessionSummary[]>
  create(input: CreateJourneyInput): Promise<JourneySummary>
  update(
    journeyId: JourneyId,
    input: UpdateJourneyInput
  ): Promise<JourneySummary | null>
  delete(journeyId: JourneyId): Promise<void>
  createSession(
    journeyId: JourneyId,
    input: CreateSessionInput
  ): Promise<JourneySessionSummary>
  updateSession(
    sessionId: SessionId,
    input: UpdateSessionInput
  ): Promise<JourneySessionSummary | null>
  deleteSession(sessionId: SessionId): Promise<void>
  createStep(sessionId: SessionId, input: CreateStepInput): Promise<StepSummary>
  updateStep(
    stepId: StepId,
    input: UpdateStepInput
  ): Promise<StepSummary | null>
  deleteStep(stepId: StepId): Promise<void>
}
