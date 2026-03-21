import type { PromptId, UserId } from "../../../shared/brand/index"
import type {
  PromptListFilters,
  PromptRepository,
} from "../../../shared/ports/index"
import { toApplicationError } from "../../../shared/utilities/index"
import {
  getPromptUseCase,
  listPromptsUseCase,
  savePromptUseCase,
  unsavePromptUseCase,
} from "../use-cases/index"
import type { PromptModuleError } from "../errors/index"

/**
 * Compatibility layer for existing API handlers.
 */
export function createPromptUseCasesAdapter(
  promptRepository: PromptRepository
) {
  return {
    async getPrompt(userId: UserId, promptId: PromptId) {
      const result = await getPromptUseCase(userId, promptId, promptRepository)

      if (isPromptModuleError(result)) {
        throw toCompatibilityError(result)
      }

      return result.prompt
    },

    async listPrompts(userId: UserId, filters: PromptListFilters) {
      return listPromptsUseCase(userId, filters, promptRepository)
    },

    async savePrompt(userId: UserId, promptId: PromptId) {
      const result = await savePromptUseCase(userId, promptId, promptRepository)

      if (isPromptModuleError(result)) {
        throw toCompatibilityError(result)
      }

      return result
    },

    async unsavePrompt(userId: UserId, promptId: PromptId) {
      const result = await unsavePromptUseCase(
        userId,
        promptId,
        promptRepository
      )

      if (isPromptModuleError(result)) {
        throw toCompatibilityError(result)
      }
    },
  }
}

function toCompatibilityError(error: PromptModuleError): Error {
  return toApplicationError(error)
}

function isPromptModuleError(
  result:
    | PromptModuleError
    | { kind: "saved"; savedAt: string }
    | { kind: "success" }
    | { kind: "success"; prompt: unknown }
): result is PromptModuleError {
  return "code" in result
}
