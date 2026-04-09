import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type {
  JourneySummary,
  JourneyDetail,
} from "../../journeys/journey-types"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { ProgressRepository } from "../progress-port"

export type ListUserJourneysDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

export function makeListUserJourneysUseCase(deps: ListUserJourneysDeps) {
  return (
    userId: UserId,
    status: "in_progress" | "completed"
  ): ResultAsync<JourneySummary[], never> =>
    ResultAsync.fromSafePromise(
      (status === "in_progress"
        ? deps.progressRepository.listActiveJourneys(userId)
        : deps.progressRepository.listCompletedJourneys(userId)
      ).then(async (progresses) => {
        const journeyDetails = await Promise.all(
          progresses.map((p) => deps.journeyRepository.getById(p.journeyId))
        )
        return journeyDetails.filter((j): j is JourneyDetail => j !== null)
      })
    )
}
