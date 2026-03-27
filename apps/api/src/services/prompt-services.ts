import {
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
  makeGetHomeUseCase,
  type DailyRecommendationRepository,
  type HomeSnapshot,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptRepository,
  type PromptSummary,
  type UserId,
  type WritingRepository,
} from "@workspace/core"
import { unwrapOrThrow } from "../http/unwrap-or-throw"

export type PromptApiService = {
  getPrompt: (userId: UserId, promptId: PromptId) => Promise<PromptDetail>
  listPrompts: (
    userId: UserId,
    filters: PromptListFilters
  ) => Promise<readonly PromptSummary[]>
  savePrompt: (
    userId: UserId,
    promptId: PromptId
  ) => Promise<{ kind: "saved"; savedAt: string }>
  unsavePrompt: (userId: UserId, promptId: PromptId) => Promise<void>
}

export type HomeApiService = {
  getHome: (userId: UserId) => Promise<HomeSnapshot>
}

export function createPromptApiService(
  promptRepository: PromptRepository
): PromptApiService {
  const getPrompt = makeGetPromptUseCase({
    promptRepository,
  })
  const listPrompts = makeListPromptsUseCase({
    promptRepository,
  })
  const savePrompt = makeSavePromptUseCase({
    promptRepository,
  })
  const unsavePrompt = makeUnsavePromptUseCase({
    promptRepository,
  })

  return {
    async getPrompt(userId, promptId) {
      return unwrapOrThrow(await getPrompt(userId, promptId))
    },
    async listPrompts(userId, filters) {
      return unwrapOrThrow(await listPrompts(userId, filters))
    },
    async savePrompt(userId, promptId) {
      const result = unwrapOrThrow(await savePrompt(userId, promptId))
      return { kind: "saved" as const, savedAt: result.savedAt }
    },
    async unsavePrompt(userId, promptId) {
      unwrapOrThrow(await unsavePrompt(userId, promptId))
    },
  }
}

export function createHomeApiService(input: {
  dailyRecommendationRepository: DailyRecommendationRepository
  writingRepository: WritingRepository
  promptRepository: PromptRepository
}): HomeApiService {
  const getHome = makeGetHomeUseCase({
    dailyRecommendationRepository: input.dailyRecommendationRepository,
    writingRepository: input.writingRepository,
    promptRepository: input.promptRepository,
  })

  return {
    async getHome(userId) {
      return unwrapOrThrow(await getHome(userId))
    },
  }
}
