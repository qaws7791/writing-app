import {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeGetHomeUseCase,
  makeGetPromptUseCase,
  makeListWritingsUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
  toApplicationError,
  type AutosaveWritingInput,
  type CursorPage,
  type CursorPageParams,
  type DailyRecommendationRepository,
  type WritingDetail,
  type WritingId,
  type WritingRepository,
  type WritingSummary,
  type HomeSnapshot,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptRepository,
  type PromptSummary,
  type UserId,
  type DomainError,
} from "@workspace/core"
import type { Result } from "neverthrow"

export type WritingApiService = {
  autosaveWriting: (
    userId: UserId,
    writingId: WritingId,
    input: AutosaveWritingInput
  ) => Promise<{
    writing: WritingDetail
    kind: "autosaved"
  }>
  createWriting: (
    userId: UserId,
    input: {
      content?: AutosaveWritingInput["content"]
      sourcePromptId?: PromptId
      title?: string
    }
  ) => Promise<WritingDetail>
  deleteWriting: (userId: UserId, writingId: WritingId) => Promise<void>
  getWriting: (userId: UserId, writingId: WritingId) => Promise<WritingDetail>
  listWritings: (
    userId: UserId,
    params?: CursorPageParams
  ) => Promise<CursorPage<WritingSummary>>
}

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

function unwrapOrThrow<TValue, TError extends DomainError>(
  result: Result<TValue, TError>
): TValue {
  if (result.isErr()) {
    throw toApplicationError(result.error)
  }

  return result.value
}

export function createWritingApiService(input: {
  writingRepository: WritingRepository
  getNow?: () => string
  promptRepository: Pick<PromptRepository, "exists">
}): WritingApiService {
  const createWriting = makeCreateWritingUseCase({
    writingRepository: input.writingRepository,
    promptExists: (promptId: PromptId) =>
      input.promptRepository.exists(promptId),
  })
  const autosaveWriting = makeAutosaveWritingUseCase({
    writingRepository: input.writingRepository,
    getNow: input.getNow ?? (() => new Date().toISOString()),
  })
  const deleteWriting = makeDeleteWritingUseCase({
    writingRepository: input.writingRepository,
  })
  const getWriting = makeGetWritingUseCase({
    writingRepository: input.writingRepository,
  })
  const listWritings = makeListWritingsUseCase({
    writingRepository: input.writingRepository,
  })

  return {
    async autosaveWriting(userId, writingId, autosaveInput) {
      const writing = unwrapOrThrow(
        await autosaveWriting(userId, writingId, autosaveInput)
      )

      return {
        writing,
        kind: "autosaved",
      }
    },
    async createWriting(userId, createInput) {
      return unwrapOrThrow(await createWriting(userId, createInput))
    },
    async deleteWriting(userId, writingId) {
      unwrapOrThrow(await deleteWriting(userId, writingId))
    },
    async getWriting(userId, writingId) {
      return unwrapOrThrow(await getWriting(userId, writingId))
    },
    async listWritings(userId, params) {
      return unwrapOrThrow(await listWritings(userId, params))
    },
  }
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
