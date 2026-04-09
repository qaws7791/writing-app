import { ResultAsync } from "neverthrow"

import type { UserId, JourneyId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../progress-port"
import type { JourneyRepository } from "../../journeys/journey-port"

export type CompletedJourneySummary = {
  readonly journeyId: JourneyId
  readonly title: string
  readonly description: string
  readonly thumbnailUrl: string | null
}

export type ListCompletedJourneysDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

export function makeListCompletedJourneysUseCase(
  deps: ListCompletedJourneysDeps
) {
  return (userId: UserId): ResultAsync<CompletedJourneySummary[], never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .listCompletedJourneys(userId)
        .then(async (progresses) => {
          const journeyDetails = await Promise.all(
            progresses.map((p) => deps.journeyRepository.getById(p.journeyId))
          )

          return progresses
            .map((p, i) => {
              const journey = journeyDetails[i]
              if (!journey) return null
              return {
                journeyId: p.journeyId,
                title: journey.title,
                description: journey.description,
                thumbnailUrl: journey.thumbnailUrl,
              }
            })
            .filter((j): j is CompletedJourneySummary => j !== null)
        })
    )
}
