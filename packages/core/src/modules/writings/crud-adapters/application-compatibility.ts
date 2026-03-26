import {
  type WritingId,
  type UserId,
  toWritingId,
} from "../../../shared/brand/index"
import type { WritingRepository } from "../writing-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { DomainError } from "../../../shared/error/index"
import { toHttpStatus } from "../../../shared/error/index"
import {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  type AutosaveWritingInput,
  type CreateWritingInput,
} from "../crud-use-cases/index"

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
export function createWritingUseCasesAdapter(
  writingRepository: WritingRepository,
  promptRepository: PromptRepository
) {
  const autosave = makeAutosaveWritingUseCase({
    writingRepository,
    getNow: () => new Date().toISOString(),
  })

  const create = makeCreateWritingUseCase({
    createWritingId: () => toWritingId(Math.floor(Math.random() * 1e9)),
    writingRepository,
    getNow: () => new Date().toISOString(),
    promptExists: (id) => promptRepository.exists(id),
  })

  const remove = makeDeleteWritingUseCase({ writingRepository })
  const get = makeGetWritingUseCase({ writingRepository })
  const list = makeListWritingsUseCase({ writingRepository })

  return {
    async autosaveWriting(
      userId: UserId,
      writingId: WritingId,
      input: AutosaveWritingInput
    ) {
      const result = await autosave(userId, writingId, input)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return { writing: result.value, kind: "autosaved" as const }
    },

    async createWriting(userId: UserId, input: CreateWritingInput) {
      const result = await create(userId, input)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return result.value
    },

    async deleteWriting(userId: UserId, writingId: WritingId) {
      const result = await remove(userId, writingId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
    },

    async getWriting(userId: UserId, writingId: WritingId) {
      const result = await get(userId, writingId)
      if (result.isErr()) throw new DomainApplicationError(result.error)
      return result.value
    },

    async listWritings(userId: UserId, limit?: number) {
      const result = await list(userId, limit ? { limit } : undefined)
      return result._unsafeUnwrap()
    },
  }
}
