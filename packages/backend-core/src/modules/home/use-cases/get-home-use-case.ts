import type { UserId } from "../../../shared/brand/index"
import type {
  DraftRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import type { HomeSnapshot } from "../model/index"

export type GetHomeUseCaseOutput = HomeSnapshot

/**
 * Retrieves home page snapshot.
 * Fetches today's prompts, saved prompts, recent drafts, and resumable draft in parallel.
 */
export async function getHomeUseCase(
  userId: UserId,
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
): Promise<GetHomeUseCaseOutput> {
  const [todayPrompts, resumeDraft, recentDrafts, savedPrompts] =
    await Promise.all([
      promptRepository.listTodayPrompts(userId, 4),
      draftRepository.resume(userId),
      draftRepository.list(userId, 10),
      promptRepository.listSaved(userId, 10),
    ])

  return {
    recentDrafts,
    resumeDraft,
    savedPrompts,
    todayPrompts,
  }
}
