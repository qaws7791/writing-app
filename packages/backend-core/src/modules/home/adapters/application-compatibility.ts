import type {
  DraftRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import type { UserId } from "../../../shared/brand/index"
import { makeGetHomeUseCase } from "../use-cases/index"

/**
 * Compatibility layer for existing API handlers.
 */
export function createHomeUseCasesAdapter(
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  const getHome = makeGetHomeUseCase({
    draftRepository,
    promptRepository,
  })

  return {
    async getHome(userId: UserId) {
      return getHome(userId)
    },
  }
}
