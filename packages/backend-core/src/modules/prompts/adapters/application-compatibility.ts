import type { PromptId, UserId } from "../../../shared/brand/index"
import type {
  PromptRepository,
  PromptListFilters,
} from "../../../shared/ports/index"
import {
  getPromptUseCase,
  listPromptsUseCase,
  savePromptUseCase,
  unsavePromptUseCase,
} from "../use-cases/index"
import { promptNotFound, type PromptModuleError } from "../errors/index"

/**
 * Compatibility layer for existing API handlers.
 */
export function createPromptUseCasesAdapter(
  promptRepository: PromptRepository
) {
  return {
    async getPrompt(userId: UserId, promptId: PromptId) {
      const result = await getPromptUseCase(userId, promptId, promptRepository)

      if (result.kind !== "success") {
        throw toApplicationError(result)
      }

      return result.prompt
    },

    async listPrompts(userId: UserId, filters: PromptListFilters) {
      return listPromptsUseCase(userId, filters, promptRepository)
    },

    async savePrompt(userId: UserId, promptId: PromptId) {
      const result = await savePromptUseCase(userId, promptId, promptRepository)

      if (result.kind !== "saved") {
        throw toApplicationError(result)
      }

      return result
    },

    async unsavePrompt(userId: UserId, promptId: PromptId) {
      const result = await unsavePromptUseCase(
        userId,
        promptId,
        promptRepository
      )

      if (result.kind !== "success") {
        throw toApplicationError(result)
      }
    },
  }
}

type ApplicationError = Error & { name: string }

function toApplicationError(error: PromptModuleError): ApplicationError {
  const err = new Error(error.message)
  ;(err as any).name = "NotFoundError"
  return err
}
