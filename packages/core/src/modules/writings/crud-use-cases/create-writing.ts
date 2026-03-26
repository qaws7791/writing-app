import { err, ok, okAsync, ResultAsync } from "neverthrow"

import type { WritingContent } from "../../../shared/schema/index"
import { createEmptyWritingContent } from "../../../shared/utilities/writing-content-utilities"
import type { WritingId, PromptId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-port"
import { buildWriting } from "../writing-operations"
import { promptNotFound, type WritingModuleError } from "../writing-error"

export type CreateWritingInput = {
  readonly content?: WritingContent
  readonly sourcePromptId?: PromptId
  readonly title?: string
}

export type CreateWritingDeps = {
  readonly createWritingId: () => WritingId
  readonly writingRepository: WritingRepository
  readonly getNow: () => string
  readonly promptExists: (id: PromptId) => Promise<boolean>
}

export function makeCreateWritingUseCase(deps: CreateWritingDeps) {
  return (
    userId: UserId,
    input: CreateWritingInput
  ): ResultAsync<WritingDetail, WritingModuleError> => {
    const sourcePromptId = input.sourcePromptId ?? null

    const validatePrompt: ResultAsync<PromptId | null, WritingModuleError> =
      sourcePromptId !== null
        ? ResultAsync.fromSafePromise(
            deps.promptExists(sourcePromptId)
          ).andThen((exists) =>
            exists
              ? ok(sourcePromptId)
              : err(promptNotFound("글감을 찾을 수 없습니다.", sourcePromptId))
          )
        : okAsync(null)

    return validatePrompt.andThen((validatedPromptId) => {
      const content = input.content ?? createEmptyWritingContent()
      const writing = buildWriting(
        deps.createWritingId(),
        input.title ?? "",
        content,
        validatedPromptId,
        deps.getNow()
      )

      return ResultAsync.fromSafePromise(
        deps.writingRepository.create(userId, {
          characterCount: writing.characterCount,
          content: writing.content,
          plainText: writing.plainText,
          sourcePromptId: writing.sourcePromptId,
          title: writing.title,
          wordCount: writing.wordCount,
        })
      )
    })
  }
}
