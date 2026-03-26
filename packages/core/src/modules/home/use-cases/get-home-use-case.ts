import type { UserId } from "../../../shared/brand/index"
import type {
  WritingRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import type { HomeSnapshot } from "../model/index"

export type GetHomeUseCaseOutput = HomeSnapshot

export type GetHomeUseCaseDependencies = {
  readonly writingRepository: WritingRepository
  readonly promptRepository: PromptRepository
}

/**
 * Retrieves home page snapshot.
 * Fetches today's prompts, saved prompts, recent writings, and resumable WritingFull in parallel.
 */
export function makeGetHomeUseCase(dependencies: GetHomeUseCaseDependencies) {
  return async (userId: UserId): Promise<GetHomeUseCaseOutput> => {
    const [todayPrompts, resumeWriting, recentWritingsPage, savedPrompts] =
      await Promise.all([
        dependencies.promptRepository.listTodayPrompts(userId, 4),
        dependencies.writingRepository.resume(userId),
        dependencies.writingRepository.list(userId, { limit: 10 }),
        dependencies.promptRepository.listSaved(userId, 10),
      ])

    return {
      recentWritings: recentWritingsPage.items,
      resumeWriting,
      savedPrompts,
      todayPrompts,
    }
  }
}

export async function getHomeUseCase(
  userId: UserId,
  writingRepository: WritingRepository,
  promptRepository: PromptRepository
): Promise<GetHomeUseCaseOutput> {
  return makeGetHomeUseCase({
    writingRepository,
    promptRepository,
  })(userId)
}
