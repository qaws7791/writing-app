import { err, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { WritingId, UserId } from "../../../shared/brand/index"
import type {
  WritingSyncRepository,
  WritingVersionRepository,
} from "../writing-port"
import {
  writingForbidden,
  writingNotFound,
  type WritingModuleError,
} from "../writing-error"
import type { WritingVersionSummary } from "../writing-types"

export type ListVersionsDeps = {
  readonly writingRepository: WritingSyncRepository
  readonly versionRepository: WritingVersionRepository
}

export function makeListVersionsUseCase(deps: ListVersionsDeps) {
  return (
    userId: UserId,
    writingId: WritingId,
    limit?: number
  ): ResultAsync<readonly WritingVersionSummary[], WritingModuleError> => {
    return ResultAsync.fromSafePromise(
      deps.writingRepository.getById(userId, writingId)
    ).andThen((access) =>
      match(access)
        .with({ kind: "not-found" }, () =>
          err<readonly WritingVersionSummary[], WritingModuleError>(
            writingNotFound("문서를 찾을 수 없습니다.", writingId)
          )
        )
        .with({ kind: "forbidden" }, ({ ownerId }) =>
          err<readonly WritingVersionSummary[], WritingModuleError>(
            writingForbidden(
              "다른 사용자의 문서에는 접근할 수 없습니다.",
              ownerId
            )
          )
        )
        .with({ kind: "writing" }, () =>
          ResultAsync.fromSafePromise(
            deps.versionRepository.list(writingId, limit)
          )
        )
        .exhaustive()
    )
  }
}
