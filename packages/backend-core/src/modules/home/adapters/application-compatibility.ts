import type {
  DraftRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import type { UserId } from "../../../shared/brand/index"
import { getHomeUseCase } from "../use-cases/index"

/**
 * Compatibility layer for existing API handlers.
 */
export function createHomeUseCasesAdapter(
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  return {
    async getHome(userId: UserId) {
      return getHomeUseCase(userId, draftRepository, promptRepository)
    },
  }
}
