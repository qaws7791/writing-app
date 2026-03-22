import {
  makeAutosaveDraftUseCase,
  makeCreateDraftUseCase,
  makeDeleteDraftUseCase,
  makeGetDraftUseCase,
  makeGetHomeUseCase,
  makeGetPromptUseCase,
  makeListDraftsUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
  toApplicationError,
  type AutosaveDraftInput,
  type DraftDetail,
  type DraftId,
  type DraftRepository,
  type DraftSummary,
  type HomeSnapshot,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptRepository,
  type PromptSummary,
  type UserId,
  toDraftId,
  type DomainError,
} from "@workspace/core"
import type { Result } from "neverthrow"

export type DraftApiService = {
  autosaveDraft: (
    userId: UserId,
    draftId: DraftId,
    input: AutosaveDraftInput
  ) => Promise<{
    draft: DraftDetail
    kind: "autosaved"
  }>
  createDraft: (
    userId: UserId,
    input: {
      content?: AutosaveDraftInput["content"]
      sourcePromptId?: PromptId
      title?: string
    }
  ) => Promise<DraftDetail>
  deleteDraft: (userId: UserId, draftId: DraftId) => Promise<void>
  getDraft: (userId: UserId, draftId: DraftId) => Promise<DraftDetail>
  listDrafts: (
    userId: UserId,
    limit?: number
  ) => Promise<readonly DraftSummary[]>
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

export function createDraftApiService(input: {
  createDraftId?: () => DraftId
  draftRepository: DraftRepository
  getNow?: () => string
  promptRepository: Pick<PromptRepository, "exists">
}): DraftApiService {
  const createDraft = makeCreateDraftUseCase({
    createDraftId:
      input.createDraftId ?? (() => toDraftId(Math.floor(Math.random() * 1e9))),
    draftRepository: input.draftRepository,
    getNow: input.getNow ?? (() => new Date().toISOString()),
    promptExists: (promptId: PromptId) =>
      input.promptRepository.exists(promptId),
  })
  const autosaveDraft = makeAutosaveDraftUseCase({
    draftRepository: input.draftRepository,
    getNow: input.getNow ?? (() => new Date().toISOString()),
  })
  const deleteDraft = makeDeleteDraftUseCase({
    draftRepository: input.draftRepository,
  })
  const getDraft = makeGetDraftUseCase({
    draftRepository: input.draftRepository,
  })
  const listDrafts = makeListDraftsUseCase({
    draftRepository: input.draftRepository,
  })

  return {
    async autosaveDraft(userId, draftId, autosaveInput) {
      const draft = unwrapOrThrow(
        await autosaveDraft(userId, draftId, autosaveInput)
      )

      return {
        draft,
        kind: "autosaved",
      }
    },
    async createDraft(userId, createInput) {
      return unwrapOrThrow(await createDraft(userId, createInput))
    },
    async deleteDraft(userId, draftId) {
      unwrapOrThrow(await deleteDraft(userId, draftId))
    },
    async getDraft(userId, draftId) {
      return unwrapOrThrow(await getDraft(userId, draftId))
    },
    async listDrafts(userId, limit) {
      return unwrapOrThrow(await listDrafts(userId, limit))
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
  draftRepository: DraftRepository
  promptRepository: PromptRepository
}): HomeApiService {
  const getHome = makeGetHomeUseCase({
    draftRepository: input.draftRepository,
    promptRepository: input.promptRepository,
  })

  return {
    async getHome(userId) {
      return unwrapOrThrow(await getHome(userId))
    },
  }
}
