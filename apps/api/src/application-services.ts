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
  type DraftModuleError,
  type DraftSummary,
  type GetHomeUseCaseOutput,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptModuleError,
  type PromptRepository,
  type PromptSummary,
  type UserId,
  toDraftId,
} from "@workspace/core"

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
  getHome: (userId: UserId) => Promise<GetHomeUseCaseOutput>
}

type ModuleError = DraftModuleError | PromptModuleError

function unwrapOrThrow<TResult extends object>(
  result: ModuleError | TResult
): TResult {
  if ("code" in result && typeof result.code === "string") {
    throw toApplicationError(result)
  }

  return result
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
      const result = unwrapOrThrow(
        await autosaveDraft(userId, draftId, autosaveInput)
      )

      return {
        draft: result.draft,
        kind: "autosaved",
      }
    },
    async createDraft(userId, createInput) {
      const result = unwrapOrThrow(await createDraft(userId, createInput))

      return result.draft
    },
    async deleteDraft(userId, draftId) {
      unwrapOrThrow(await deleteDraft(userId, draftId))
    },
    async getDraft(userId, draftId) {
      const result = unwrapOrThrow(await getDraft(userId, draftId))

      return result.draft
    },
    listDrafts,
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
      const result = unwrapOrThrow(await getPrompt(userId, promptId))

      return result.prompt
    },
    listPrompts,
    async savePrompt(userId, promptId) {
      const result = unwrapOrThrow(await savePrompt(userId, promptId))

      return result
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
    getHome,
  }
}
