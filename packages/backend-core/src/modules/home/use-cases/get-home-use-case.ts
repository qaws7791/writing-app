import type { UserId } from "../../../shared/brand/index"
import type {
  DraftRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import type { HomeSnapshot } from "../model/index"

export type GetHomeUseCaseOutput = HomeSnapshot

export type GetHomeUseCaseDependencies = {
  readonly draftRepository: DraftRepository
  readonly promptRepository: PromptRepository
}

/**
 * Retrieves home page snapshot.
 * Fetches today's prompts, saved prompts, recent drafts, and resumable draft in parallel.
 */
export function makeGetHomeUseCase(dependencies: GetHomeUseCaseDependencies) {
  return async (userId: UserId): Promise<GetHomeUseCaseOutput> => {
    const [todayPrompts, resumeDraft, recentDrafts, savedPrompts] =
      await Promise.all([
        dependencies.promptRepository.listTodayPrompts(userId, 4),
        dependencies.draftRepository.resume(userId),
        dependencies.draftRepository.list(userId, 10),
        dependencies.promptRepository.listSaved(userId, 10),
      ])

    return {
      recentDrafts,
      resumeDraft,
      savedPrompts,
      todayPrompts,
    }
  }
}

export async function getHomeUseCase(
  userId: UserId,
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
): Promise<GetHomeUseCaseOutput> {
  return makeGetHomeUseCase({
    draftRepository,
    promptRepository,
  })(userId)
}
