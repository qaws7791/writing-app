import { ResultAsync } from "neverthrow"

import type { UserId, JourneyId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../progress-port"

export type CompletedJourneySummary = {
  readonly journeyId: JourneyId
  readonly title: string
  readonly description: string
  readonly thumbnailUrl: string | null
}

export type ListCompletedJourneysDeps = {
  readonly progressRepository: ProgressRepository
}

export function makeListCompletedJourneysUseCase(
  deps: ListCompletedJourneysDeps
) {
  return (userId: UserId): ResultAsync<CompletedJourneySummary[], never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .listUserJourneyItems(userId, "completed")
        .then((journeys) =>
          journeys.map((journey) => ({
            journeyId: journey.id,
            title: journey.title,
            description: journey.description,
            thumbnailUrl: journey.thumbnailUrl,
          }))
        )
    )
}
