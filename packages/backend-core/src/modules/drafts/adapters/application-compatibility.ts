import type { DraftId, PromptId, UserId } from "../../../shared/brand/index"
import type {
  DraftRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import {
  autosaveDraftUseCase,
  createDraftUseCase,
  deleteDraftUseCase,
  getDraftUseCase,
  listDraftsUseCase,
  type AutosaveDraftInput,
  type CreateDraftInput,
  type GetDraftUseCaseOutput,
} from "../use-cases/index"
import {
  draftForbidden,
  draftNotFound,
  draftValidationFailed,
  type DraftModuleError,
} from "../errors/index"

/**
 * Compatibility layer for existing API handlers.
 * Wraps individual use-cases into a factory object matching the old interface.
 *
 * This is a temporary adapter during migration from application/ to backend-core/.
 * TODO: Migrate handlers directly to use-case functions instead of this wrapper.
 */
export function createDraftUseCasesAdapter(
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  return {
    async autosaveDraft(
      userId: UserId,
      draftId: DraftId,
      input: AutosaveDraftInput
    ) {
      const result = await autosaveDraftUseCase(
        userId,
        draftId,
        input,
        draftRepository,
        () => new Date().toISOString()
      )

      if (result.kind !== "success") {
        throw toApplicationError(result)
      }

      return { draft: result.draft, kind: "autosaved" as const }
    },

    async createDraft(userId: UserId, input: CreateDraftInput) {
      const result = await createDraftUseCase(
        userId,
        input,
        draftRepository,
        (id) => promptRepository.exists(id),
        () => Math.floor(Math.random() * 1e9) as any, // TODO: use proper ID generator
        () => new Date().toISOString()
      )

      if (result.kind !== "success") {
        throw toApplicationError(result)
      }

      return result.draft
    },

    async deleteDraft(userId: UserId, draftId: DraftId) {
      const result = await deleteDraftUseCase(userId, draftId, draftRepository)

      if (result.kind !== "success") {
        throw toApplicationError(result)
      }
    },

    async getDraft(userId: UserId, draftId: DraftId) {
      const result = await getDraftUseCase(userId, draftId, draftRepository)

      if (result.kind !== "success") {
        throw toApplicationError(result)
      }

      return result.draft
    },

    async listDrafts(userId: UserId, limit?: number) {
      return listDraftsUseCase(userId, draftRepository, limit)
    },
  }
}

// Error conversion
type ApplicationError = Error & { name: string }

function toApplicationError(error: DraftModuleError): ApplicationError {
  const ApplicationError = {
    "draft-not-found": () => {
      const err = new Error(error.message)
      ;(err as any).name = "NotFoundError"
      return err
    },
    "draft-forbidden": () => {
      const err = new Error(error.message)
      ;(err as any).name = "ForbiddenError"
      return err
    },
    "draft-validation-failed": () => {
      const err = new Error(error.message)
      ;(err as any).name = "ValidationError"
      return err
    },
    "prompt-not-found": () => {
      const err = new Error(error.message)
      ;(err as any).name = "NotFoundError"
      return err
    },
  }

  const handler = ApplicationError[error.kind as keyof typeof ApplicationError]
  return handler ? handler() : new Error(error.message)
}
