import type { DailyRecommendationRepository } from "../../daily-recommendation/daily-recommendation-port"
import type { WritingRepository } from "../../writings/writing-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { UserId } from "../../../shared/brand/index"
import { makeGetHomeUseCase } from "../use-cases/index"

/**
 * @deprecated Migrate handlers to use neverthrow-based use-cases directly.
 */
export function createHomeUseCasesAdapter(
  dailyRecommendationRepository: DailyRecommendationRepository,
  writingRepository: WritingRepository,
  promptRepository: PromptRepository
) {
  const getHome = makeGetHomeUseCase({
    dailyRecommendationRepository,
    writingRepository,
    promptRepository,
  })

  return {
    async getHome(userId: UserId) {
      const result = await getHome(userId)
      return result._unsafeUnwrap()
    },
  }
}
