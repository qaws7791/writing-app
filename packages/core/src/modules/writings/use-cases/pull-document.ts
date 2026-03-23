import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { DraftId, UserId } from "../../../shared/brand/index"
import type { WritingRepository } from "../writing-port"
import {
  writingForbidden,
  writingNotFound,
  type WritingModuleError,
} from "../writing-error"
import type { SyncPullResult } from "../writing-types"

export type PullDocumentDeps = {
  readonly writingRepository: WritingRepository
}

export function makePullDocumentUseCase(deps: PullDocumentDeps) {
  return (
    userId: UserId,
    draftId: DraftId,
    sinceVersion?: number
  ): ResultAsync<SyncPullResult, WritingModuleError> => {
    return ResultAsync.fromSafePromise(
      deps.writingRepository.getById(userId, draftId)
    ).andThen((access) =>
      match(access)
        .with({ kind: "not-found" }, () =>
          err<SyncPullResult, WritingModuleError>(
            writingNotFound("문서를 찾을 수 없습니다.", draftId)
          )
        )
        .with({ kind: "forbidden" }, ({ ownerId }) =>
          err<SyncPullResult, WritingModuleError>(
            writingForbidden(
              "다른 사용자의 문서에는 접근할 수 없습니다.",
              ownerId
            )
          )
        )
        .with({ kind: "writing" }, ({ writing }) => {
          const hasNewerVersion =
            sinceVersion !== undefined && writing.version > sinceVersion

          return ok({
            version: writing.version,
            title: writing.title,
            content: writing.content,
            lastSavedAt: writing.lastSavedAt,
            hasNewerVersion,
          })
        })
        .exhaustive()
    )
  }
}
