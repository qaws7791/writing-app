import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { DailyRecommendationRepository } from "../../daily-recommendation/daily-recommendation-port"
import { makeEnsureTodayRecommendationsUseCase } from "../../daily-recommendation/use-cases/ensure-today-recommendations"
import type { DraftRepository } from "../../drafts/draft-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { HomeSnapshot } from "../home-types"

export type GetHomeDeps = {
  readonly dailyRecommendationRepository: DailyRecommendationRepository
  readonly draftRepository: DraftRepository
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
          deps.draftRepository.resume(userId),
          deps.draftRepository.list(userId, 10),
          deps.promptRepository.listSaved(userId, 10),
        ]).then(([todayPrompts, resumeDraft, recentDrafts, savedPrompts]) => ({
          recentDrafts,
          resumeDraft,
          savedPrompts,
          todayPrompts,
        }))
      )
    )
}
