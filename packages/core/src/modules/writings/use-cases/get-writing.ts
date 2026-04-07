import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-port"
import {
  writingForbidden,
  writingNotFound,
  type WritingModuleError,
} from "../writing-error"

export type GetWritingDeps = {
  readonly writingRepository: WritingRepository
}

export function makeGetWritingUseCase(deps: GetWritingDeps) {
  return (
    userId: UserId,
    writingId: WritingId
  ): ResultAsync<WritingDetail, WritingModuleError> =>
    ResultAsync.fromSafePromise(
      deps.writingRepository.getById(userId, writingId)
    ).andThen((result) =>
      match(result)
        .with({ kind: "writing" }, ({ writing }) => ok(writing))
        .with({ kind: "not-found" }, () =>
          err(writingNotFound("글을 찾을 수 없습니다.", writingId))
        )
        .with({ kind: "forbidden" }, () =>
          err(writingForbidden("다른 사용자의 글에는 접근할 수 없습니다."))
        )
        .exhaustive()
    )
}
