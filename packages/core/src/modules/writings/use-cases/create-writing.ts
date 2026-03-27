import { err, ok, okAsync, ResultAsync } from "neverthrow"

import type { WritingContent } from "../../../shared/schema/index"
import { createEmptyWritingContent } from "../../../shared/utilities/writing-content-utilities"
import type { PromptId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-port"
import { computeWritingMetrics } from "../writing-operations"
import { promptNotFound, type WritingModuleError } from "../writing-error"

export type CreateWritingInput = {
  readonly content?: WritingContent
  readonly sourcePromptId?: PromptId
  readonly title?: string
}

export type CreateWritingDeps = {
  readonly writingRepository: WritingRepository
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
      const metrics = computeWritingMetrics(content)

      return ResultAsync.fromSafePromise(
        deps.writingRepository.create(userId, {
          characterCount: metrics.characterCount,
          content,
          plainText: metrics.plainText,
          sourcePromptId: validatedPromptId,
          title: input.title ?? "",
          wordCount: metrics.wordCount,
        })
      )
    })
  }
}
