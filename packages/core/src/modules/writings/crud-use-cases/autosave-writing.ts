import { err, errAsync, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingContent } from "../../../shared/schema/index"
import { extractWritingTextMetrics } from "../../../shared/utilities/writing-content-utilities"
import type { WritingFull, WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-port"
import { updateWritingContent, updateWritingTitle } from "../writing-operations"
import {
  writingForbidden,
  writingNotFound,
  writingValidationFailed,
  type WritingModuleError,
} from "../writing-error"

export type AutosaveWritingInput = {
  readonly content?: WritingContent
  readonly title?: string
}

export type AutosaveWritingDeps = {
  readonly writingRepository: WritingRepository
  readonly getNow: () => string
}

function toWriting(detail: WritingDetail): WritingFull {
  const metrics = extractWritingTextMetrics(detail.content)

  return {
    characterCount: detail.characterCount,
    content: detail.content,
    createdAt: detail.createdAt,
    id: detail.id,
    lastSavedAt: detail.lastSavedAt,
    plainText: metrics.plainText,
    preview: detail.preview,
    sourcePromptId: detail.sourcePromptId,
    title: detail.title,
    updatedAt: detail.updatedAt,
    wordCount: detail.wordCount,
  }
}

export function makeAutosaveWritingUseCase(deps: AutosaveWritingDeps) {
  return (
    userId: UserId,
    writingId: WritingId,
    input: AutosaveWritingInput
  ): ResultAsync<WritingDetail, WritingModuleError> => {
    if (input.title === undefined && input.content === undefined) {
      return errAsync(
        writingValidationFailed("변경할 제목 또는 본문이 필요합니다.")
      )
    }

    return ResultAsync.fromSafePromise(
      deps.writingRepository.getById(userId, writingId)
    )
      .andThen((existing) =>
        match(existing)
          .with({ kind: "writing" }, ({ writing }) => ok(writing))
          .with({ kind: "not-found" }, () =>
            err(writingNotFound("글을 찾을 수 없습니다.", writingId))
          )
          .with({ kind: "forbidden" }, ({ ownerId }) =>
            err(
              writingForbidden(
                "다른 사용자의 글에는 접근할 수 없습니다.",
                ownerId
              )
            )
          )
          .exhaustive()
      )
      .andThen((existingWriting) => {
        const now = deps.getNow()
        const nextTitle = input.title ?? existingWriting.title
        const nextContent = input.content ?? existingWriting.content

        let updated = updateWritingTitle(
          toWriting(existingWriting),
          nextTitle,
          now
        )
        if (input.content !== undefined) {
          updated = updateWritingContent(updated, nextContent, now)
        }

        return ResultAsync.fromSafePromise(
          deps.writingRepository.replace(userId, writingId, {
            characterCount: updated.characterCount,
            content: updated.content,
            plainText: updated.plainText,
            sourcePromptId: updated.sourcePromptId,
            title: updated.title,
            wordCount: updated.wordCount,
          })
        ).andThen((persisted) =>
          match(persisted)
            .with({ kind: "writing" }, ({ writing }) => ok(writing))
            .with({ kind: "not-found" }, () =>
              err(writingNotFound("글을 찾을 수 없습니다.", writingId))
            )
            .with({ kind: "forbidden" }, ({ ownerId }) =>
              err(
                writingForbidden(
                  "다른 사용자의 글에는 접근할 수 없습니다.",
                  ownerId
                )
              )
            )
            .exhaustive()
        )
      })
  }
}
