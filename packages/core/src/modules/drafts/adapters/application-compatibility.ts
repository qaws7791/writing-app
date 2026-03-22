import {
  type DraftId,
  type UserId,
  toDraftId,
} from "../../../shared/brand/index"
import type { DraftRepository } from "../draft-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { DomainError } from "../../../shared/error/index"
import { toHttpStatus } from "../../../shared/error/index"
import {
  makeAutosaveDraftUseCase,
  makeCreateDraftUseCase,
  makeDeleteDraftUseCase,
  makeGetDraftUseCase,
  makeListDraftsUseCase,
  type AutosaveDraftInput,
  type CreateDraftInput,
} from "../use-cases/index"

class DomainApplicationError extends Error {
  readonly statusCode: number
  constructor(error: DomainError) {
    super(error.message)
    this.name = error.code
    this.statusCode = toHttpStatus(error)
  }
}

/**
 * @deprecated Migrate handlers to use neverthrow-based use-cases directly.
 */
export function createDraftUseCasesAdapter(
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  const autosave = makeAutosaveDraftUseCase({
    draftRepository,
    getNow: () => new Date().toISOString(),
  })

  const create = makeCreateDraftUseCase({
    createDraftId: () => toDraftId(Math.floor(Math.random() * 1e9)),
    draftRepository,
    getNow: () => new Date().toISOString(),
    promptExists: (id) => promptRepository.exists(id),
  })

  const remove = makeDeleteDraftUseCase({ draftRepository })
  const get = makeGetDraftUseCase({ draftRepository })
  const list = makeListDraftsUseCase({ draftRepository })

  return {
    async autosaveDraft(
      userId: UserId,
      draftId: DraftId,
      input: AutosaveDraftInput
    ) {
      const result = await autosave(userId, draftId, input)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return { draft: result.value, kind: "autosaved" as const }
    },

    async createDraft(userId: UserId, input: CreateDraftInput) {
      const result = await create(userId, input)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return result.value
    },

    async deleteDraft(userId: UserId, draftId: DraftId) {
      const result = await remove(userId, draftId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
    },

    async getDraft(userId: UserId, draftId: DraftId) {
      const result = await get(userId, draftId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return result.value
    },

    async listDrafts(userId: UserId, limit?: number) {
      const result = await list(userId, limit)
      return result._unsafeUnwrap()
    },
  }
}
