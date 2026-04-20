import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../../progress/progress-port"
import type { HomeSnapshot, ActiveJourneySummary } from "../home-types"

export type GetHomeDeps = {
  readonly progressRepository: ProgressRepository
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  return (userId: UserId): ResultAsync<HomeSnapshot, never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .listUserJourneyItems(userId, "in_progress")
        .then((journeys) => {
          const activeJourneys: ActiveJourneySummary[] = journeys.map(
            (journey) => ({
              journeyId: journey.id,
              title: journey.title,
              description: journey.description,
              thumbnailUrl: journey.thumbnailUrl,
              completionRate:
                journey.sessionCount > 0
                  ? Math.min(
                      1,
                      (journey.currentSessionOrder - 1) / journey.sessionCount
                    )
                  : 0,
              currentSessionOrder: journey.currentSessionOrder,
            })
          )

          return {
            activeJourneys,
            showStartJourneyCta: activeJourneys.length === 0,
            showWritingSuggestion: true,
          }
        })
    )
}
