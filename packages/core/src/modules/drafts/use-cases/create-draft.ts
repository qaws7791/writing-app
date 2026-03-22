import { err, ok, okAsync, ResultAsync } from "neverthrow"

import type { DraftContent } from "../../../shared/schema/index"
import { createEmptyDraftContent } from "../../../shared/utilities/draft-content-utilities"
import type { DraftId, PromptId, UserId } from "../../../shared/brand/index"
import type { DraftDetail } from "../draft-types"
import type { DraftRepository } from "../draft-port"
import { buildDraft } from "../draft-operations"
import { promptNotFound, type DraftModuleError } from "../draft-error"

export type CreateDraftInput = {
  readonly content?: DraftContent
  readonly sourcePromptId?: PromptId
  readonly title?: string
}

export type CreateDraftDeps = {
  readonly createDraftId: () => DraftId
  readonly draftRepository: DraftRepository
  readonly getNow: () => string
  readonly promptExists: (id: PromptId) => Promise<boolean>
}

export function makeCreateDraftUseCase(deps: CreateDraftDeps) {
  return (
    userId: UserId,
    input: CreateDraftInput
  ): ResultAsync<DraftDetail, DraftModuleError> => {
    const sourcePromptId = input.sourcePromptId ?? null

    const validatePrompt: ResultAsync<PromptId | null, DraftModuleError> =
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
      const content = input.content ?? createEmptyDraftContent()
      const draft = buildDraft(
        deps.createDraftId(),
        input.title ?? "",
        content,
        validatedPromptId,
        deps.getNow()
      )

      return ResultAsync.fromSafePromise(
        deps.draftRepository.create(userId, {
          characterCount: draft.characterCount,
          content: draft.content,
          plainText: draft.plainText,
          sourcePromptId: draft.sourcePromptId,
          title: draft.title,
          wordCount: draft.wordCount,
        })
      )
    })
  }
}
