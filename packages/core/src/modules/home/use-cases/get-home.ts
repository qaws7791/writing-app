import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../../progress/progress-port"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { HomeSnapshot, ActiveJourneySummary } from "../home-types"

export type GetHomeDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  return (userId: UserId): ResultAsync<HomeSnapshot, never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .listActiveJourneys(userId)
        .then(async (activeProgresses) => {
          const journeyDetails = await Promise.all(
            activeProgresses.map((p) =>
              deps.journeyRepository.getById(p.journeyId)
            )
          )

          const activeJourneys: ActiveJourneySummary[] = activeProgresses
            .map((p, i) => {
              const journey = journeyDetails[i]
              if (!journey) return null
              return {
                journeyId: p.journeyId,
                title: journey.title,
                description: journey.description,
                thumbnailUrl: journey.thumbnailUrl,
                completionRate:
                  journey.sessionCount > 0
                    ? Math.min(
                        1,
                        (p.currentSessionOrder - 1) / journey.sessionCount
                      )
                    : 0,
                currentSessionOrder: p.currentSessionOrder,
              }
            })
            .filter((j): j is ActiveJourneySummary => j !== null)

          return {
            activeJourneys,
            showStartJourneyCta: activeJourneys.length === 0,
            showWritingSuggestion: true,
          }
        })
    )
}
