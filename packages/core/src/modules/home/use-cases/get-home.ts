import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { DailyRecommendationRepository } from "../../daily-recommendation/daily-recommendation-port"
import { makeEnsureTodayRecommendationsUseCase } from "../../daily-recommendation/use-cases/ensure-today-recommendations"
import type { WritingRepository } from "../../writings/writing-crud-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { HomeSnapshot } from "../home-types"

export type GetHomeDeps = {
  readonly dailyRecommendationRepository: DailyRecommendationRepository
  readonly writingRepository: WritingRepository
  readonly promptRepository: PromptRepository
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  const ensureTodayRecommendations = makeEnsureTodayRecommendationsUseCase({
    dailyRecommendationRepository: deps.dailyRecommendationRepository,
  })

  return (userId: UserId): ResultAsync<HomeSnapshot, never> =>
    ResultAsync.fromSafePromise(
      ensureTodayRecommendations().then(() =>
        Promise.all([
          deps.promptRepository.listTodayPrompts(userId, 2),
          deps.writingRepository.resume(userId),
          deps.writingRepository.list(userId, { limit: 10 }),
          deps.promptRepository.listSaved(userId, 10),
        ]).then(
          ([
            todayPrompts,
            resumeWriting,
            recentWritingsPage,
            savedPrompts,
          ]) => ({
            recentWritings: recentWritingsPage.items,
            resumeWriting,
            savedPrompts,
            todayPrompts,
          })
        )
      )
    )
}
