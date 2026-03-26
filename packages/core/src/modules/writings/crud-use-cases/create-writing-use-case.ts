import type { WritingContent } from "../../../shared/schema/index"
import { createEmptyWritingContent } from "../../../shared/utilities/index"
import type { WritingId, PromptId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-crud-port"
import { buildWriting } from "../writing-crud-operations"
import { promptNotFound, type WritingModuleError } from "../writing-error"

export type CreateWritingInput = {
  readonly content?: WritingContent
  readonly sourcePromptId?: PromptId
  readonly title?: string
}

export type CreateWritingUseCaseOutput =
  | { kind: "success"; writing: WritingDetail }
  | WritingModuleError

export type CreateWritingUseCaseDependencies = {
  readonly createWritingId: () => WritingId
  readonly writingRepository: WritingRepository
  readonly getNow: () => string
  readonly promptExists: (id: PromptId) => Promise<boolean>
}

export function makeCreateWritingUseCase(
  dependencies: CreateWritingUseCaseDependencies
) {
  return async (
    userId: UserId,
    input: CreateWritingInput
  ): Promise<CreateWritingUseCaseOutput> => {
    const sourcePromptId = input.sourcePromptId ?? null

    if (sourcePromptId !== null) {
      const exists = await dependencies.promptExists(sourcePromptId)
      if (!exists) {
        return promptNotFound("글감을 찾을 수 없습니다.", sourcePromptId)
      }
    }

    const content = input.content ?? createEmptyWritingContent()
    const writing = buildWriting(
      dependencies.createWritingId(),
      input.title ?? "",
      content,
      sourcePromptId,
      dependencies.getNow()
    )

    const persisted = await dependencies.writingRepository.create(userId, {
      characterCount: writing.characterCount,
      content: writing.content,
      plainText: writing.plainText,
      sourcePromptId: writing.sourcePromptId,
      title: writing.title,
      wordCount: writing.wordCount,
    })

    return {
      writing: persisted,
      kind: "success",
    }
  }
}

/**
 * Creates a new writing.
 * Validates source prompt exists if provided.
 */
export async function createWritingUseCase(
  userId: UserId,
  input: CreateWritingInput,
  writingRepository: WritingRepository,
  promptExists: (id: PromptId) => Promise<boolean>,
  createId: () => WritingId,
  getNow: () => string
): Promise<CreateWritingUseCaseOutput> {
  return makeCreateWritingUseCase({
    createWritingId: createId,
    writingRepository,
    getNow,
    promptExists,
  })(userId, input)
}
