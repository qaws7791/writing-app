import {
  type DraftId,
  type UserId,
  toDraftId,
} from "../../../shared/brand/index"
import type {
  DraftRepository,
  PromptRepository,
} from "../../../shared/ports/index"
import { toApplicationError } from "../../../shared/utilities/index"
import {
  autosaveDraftUseCase,
  createDraftUseCase,
  deleteDraftUseCase,
  getDraftUseCase,
  listDraftsUseCase,
  type AutosaveDraftInput,
  type CreateDraftInput,
} from "../use-cases/index"
import type { DraftModuleError } from "../errors/index"

/**
 * Compatibility layer for existing API handlers.
 * Wraps individual use-cases into a factory object matching the old interface.
 *
 * This is a temporary adapter during migration from application/ to core/.
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

      if (isDraftModuleError(result)) {
        throw toCompatibilityError(result)
      }

      return { draft: result.draft, kind: "autosaved" as const }
    },

    async createDraft(userId: UserId, input: CreateDraftInput) {
      const result = await createDraftUseCase(
        userId,
        input,
        draftRepository,
        (id) => promptRepository.exists(id),
        () => toDraftId(Math.floor(Math.random() * 1e9)),
        () => new Date().toISOString()
      )

      if (isDraftModuleError(result)) {
        throw toCompatibilityError(result)
      }

      return result.draft
    },

    async deleteDraft(userId: UserId, draftId: DraftId) {
      const result = await deleteDraftUseCase(userId, draftId, draftRepository)

      if (isDraftModuleError(result)) {
        throw toCompatibilityError(result)
      }
    },

    async getDraft(userId: UserId, draftId: DraftId) {
      const result = await getDraftUseCase(userId, draftId, draftRepository)

      if (isDraftModuleError(result)) {
        throw toCompatibilityError(result)
      }

      return result.draft
    },

    async listDrafts(userId: UserId, limit?: number) {
      return listDraftsUseCase(userId, draftRepository, limit)
    },
  }
}

function toCompatibilityError(error: DraftModuleError): Error {
  return toApplicationError(error)
}

function isDraftModuleError(
  result:
    | DraftModuleError
    | { kind: "success" }
    | { kind: "success"; draft: unknown }
): result is DraftModuleError {
  return "code" in result
}
