import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptListFilters } from "../prompt-types"
import type { PromptRepository } from "../prompt-port"
import type { DomainError } from "../../../shared/error/index"
import { toHttpStatus } from "../../../shared/error/index"
import {
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
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
export function createPromptUseCasesAdapter(
  promptRepository: PromptRepository
) {
  const get = makeGetPromptUseCase({ promptRepository })
  const listAll = makeListPromptsUseCase({ promptRepository })
  const save = makeSavePromptUseCase({ promptRepository })
  const unsave = makeUnsavePromptUseCase({ promptRepository })

  return {
    async getPrompt(userId: UserId, promptId: PromptId) {
      const result = await get(userId, promptId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return result.value
    },

    async listPrompts(userId: UserId, filters: PromptListFilters) {
      const result = await listAll(userId, filters)
      return result._unsafeUnwrap()
    },

    async savePrompt(userId: UserId, promptId: PromptId) {
      const result = await save(userId, promptId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return { kind: "saved" as const, savedAt: result.value.savedAt }
    },

    async unsavePrompt(userId: UserId, promptId: PromptId) {
      const result = await unsave(userId, promptId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
    },
  }
}
