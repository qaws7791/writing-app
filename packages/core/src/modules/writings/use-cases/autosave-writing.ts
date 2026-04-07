import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-port"
import {
  writingForbidden,
  writingNotFound,
  writingValidationFailed,
  type WritingModuleError,
} from "../writing-error"

export type AutosaveWritingInput = {
  readonly title?: string
  readonly bodyJson?: unknown
  readonly bodyPlainText?: string
  readonly wordCount?: number
}

export type AutosaveWritingDeps = {
  readonly writingRepository: WritingRepository
}

export function makeAutosaveWritingUseCase(deps: AutosaveWritingDeps) {
  return (
    userId: UserId,
    writingId: WritingId,
    input: AutosaveWritingInput
  ): ResultAsync<WritingDetail, WritingModuleError> => {
    if (
      input.title === undefined &&
      input.bodyJson === undefined &&
      input.bodyPlainText === undefined
    ) {
      return ResultAsync.fromSafePromise(
        Promise.resolve(
          err(writingValidationFailed("변경할 제목 또는 본문이 필요합니다."))
        )
      ).andThen((r) => r)
    }

    return ResultAsync.fromSafePromise(
      deps.writingRepository.update(userId, writingId, {
        title: input.title,
        bodyJson: input.bodyJson,
        bodyPlainText: input.bodyPlainText,
        wordCount: input.wordCount,
      })
    ).andThen((result) =>
      match(result)
        .with({ kind: "updated" }, ({ writing }) => ok(writing))
        .with({ kind: "not-found" }, () =>
          err(writingNotFound("글을 찾을 수 없습니다.", writingId))
        )
        .with({ kind: "forbidden" }, () =>
          err(writingForbidden("다른 사용자의 글에는 접근할 수 없습니다."))
        )
        .exhaustive()
    )
  }
}
