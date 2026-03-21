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
  type GetHomeUseCaseOutput,
  type GetPromptUseCaseOutput,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptModuleError,
  type PromptRepository,
  type SavePromptUseCaseOutput,
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
  ) => ReturnType<DraftRepository["list"]>
}

export type PromptApiService = {
  getPrompt: (userId: UserId, promptId: PromptId) => Promise<PromptDetail>
  listPrompts: (
    userId: UserId,
    filters: PromptListFilters
  ) => ReturnType<PromptRepository["list"]>
  savePrompt: (
    userId: UserId,
    promptId: PromptId
  ) => Promise<{ kind: "saved"; savedAt: string }>
  unsavePrompt: (userId: UserId, promptId: PromptId) => Promise<void>
}

export type HomeApiService = {
  getHome: (userId: UserId) => Promise<GetHomeUseCaseOutput>
}

function isDraftModuleError(
  result:
    | DraftModuleError
    | { kind: "success" }
    | { kind: "success"; draft: DraftDetail }
): result is DraftModuleError {
  return "code" in result
}

function isPromptModuleError(
  result:
    | GetPromptUseCaseOutput
    | PromptModuleError
    | SavePromptUseCaseOutput
    | { kind: "success" }
): result is PromptModuleError {
  return "code" in result
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
      const result = await autosaveDraft(userId, draftId, autosaveInput)

      if (isDraftModuleError(result)) {
        throw toApplicationError(result)
      }

      return {
        draft: result.draft,
        kind: "autosaved",
      }
    },
    async createDraft(userId, createInput) {
      const result = await createDraft(userId, createInput)

      if (isDraftModuleError(result)) {
        throw toApplicationError(result)
      }

      return result.draft
    },
    async deleteDraft(userId, draftId) {
      const result = await deleteDraft(userId, draftId)

      if (isDraftModuleError(result)) {
        throw toApplicationError(result)
      }
    },
    async getDraft(userId, draftId) {
      const result = await getDraft(userId, draftId)

      if (isDraftModuleError(result)) {
        throw toApplicationError(result)
      }

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
      const result = await getPrompt(userId, promptId)

      if (isPromptModuleError(result)) {
        throw toApplicationError(result)
      }

      return result.prompt
    },
    listPrompts,
    async savePrompt(userId, promptId) {
      const result = await savePrompt(userId, promptId)

      if (isPromptModuleError(result)) {
        throw toApplicationError(result)
      }

      return result
    },
    async unsavePrompt(userId, promptId) {
      const result = await unsavePrompt(userId, promptId)

      if (isPromptModuleError(result)) {
        throw toApplicationError(result)
      }
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
