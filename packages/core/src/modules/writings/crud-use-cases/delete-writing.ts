import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingRepository } from "../writing-port"
import {
  writingForbidden,
  writingNotFound,
  type WritingModuleError,
} from "../writing-error"

export type DeleteWritingDeps = {
  readonly writingRepository: WritingRepository
}

export function makeDeleteWritingUseCase(deps: DeleteWritingDeps) {
  return (
    userId: UserId,
    writingId: WritingId
  ): ResultAsync<void, WritingModuleError> =>
    ResultAsync.fromSafePromise(
      deps.writingRepository.delete(userId, writingId)
    ).andThen((result) =>
      match(result)
        .with({ kind: "deleted" }, () => ok(undefined))
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
}
