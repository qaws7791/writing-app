import type { DailyRecommendationRepository } from "../../daily-recommendation/daily-recommendation-port"
import type { DraftRepository } from "../../drafts/draft-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { UserId } from "../../../shared/brand/index"
import { makeGetHomeUseCase } from "../use-cases/index"

/**
 * @deprecated Migrate handlers to use neverthrow-based use-cases directly.
 */
export function createHomeUseCasesAdapter(
  dailyRecommendationRepository: DailyRecommendationRepository,
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  const getHome = makeGetHomeUseCase({
    dailyRecommendationRepository,
    draftRepository,
    promptRepository,
  })

  return {
    async getHome(userId: UserId) {
      const result = await getHome(userId)
      return result._unsafeUnwrap()
    },
  }
}
