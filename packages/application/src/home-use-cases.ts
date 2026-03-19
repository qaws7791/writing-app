import type {
  DraftRepository,
  HomeSnapshot,
  PromptRepository,
  UserId,
} from "@workspace/domain"

export function createHomeUseCases(
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  return {
    async getHome(userId: UserId): Promise<HomeSnapshot> {
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
    },
  }
}
