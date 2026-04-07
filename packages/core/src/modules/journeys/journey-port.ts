import type { JourneyId, SessionId } from "../../shared/brand/index"
import type {
  JourneyCategory,
  JourneyDetail,
  JourneySessionDetail,
  JourneySummary,
} from "./journey-types"

export interface JourneyRepository {
  list(filters?: { category?: JourneyCategory }): Promise<JourneySummary[]>
  getById(journeyId: JourneyId): Promise<JourneyDetail | null>
  getSessionDetail(sessionId: SessionId): Promise<JourneySessionDetail | null>
}
