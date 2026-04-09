import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { ProgressRepository } from "../../progress/progress-port"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { HomeSnapshot, ActiveJourneySummary } from "../home-types"

function getKstDateKey(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

export type GetHomeDeps = {
  readonly promptRepository: PromptRepository
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  return (userId: UserId): ResultAsync<HomeSnapshot, never> =>
    ResultAsync.fromSafePromise(
      Promise.all([
        deps.promptRepository.getDailyPrompt(userId, getKstDateKey()),
        deps.progressRepository.listActiveJourneys(userId),
      ]).then(async ([dailyPrompt, activeProgresses]) => {
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
              completionRate: p.completionRate,
              currentSessionOrder: p.currentSessionOrder,
            }
          })
          .filter((j): j is ActiveJourneySummary => j !== null)

        return { dailyPrompt, activeJourneys }
      })
    )
}
