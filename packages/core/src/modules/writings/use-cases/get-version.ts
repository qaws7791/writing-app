import { err, ok, ResultAsync } from "neverthrow"
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
import type { WritingVersionDetail } from "../writing-types"

export type GetVersionDeps = {
  readonly writingRepository: WritingSyncRepository
  readonly versionRepository: WritingVersionRepository
}

export function makeGetVersionUseCase(deps: GetVersionDeps) {
  return (
    userId: UserId,
    writingId: WritingId,
    version: number
  ): ResultAsync<WritingVersionDetail, WritingModuleError> => {
    return ResultAsync.fromSafePromise(
      deps.writingRepository.getById(userId, writingId)
    ).andThen((access) =>
      match(access)
        .with({ kind: "not-found" }, () =>
          err<WritingVersionDetail, WritingModuleError>(
            writingNotFound("문서를 찾을 수 없습니다.", writingId)
          )
        )
        .with({ kind: "forbidden" }, ({ ownerId }) =>
          err<WritingVersionDetail, WritingModuleError>(
            writingForbidden(
              "다른 사용자의 문서에는 접근할 수 없습니다.",
              ownerId
            )
          )
        )
        .with({ kind: "writing" }, () =>
          ResultAsync.fromSafePromise(
            deps.versionRepository.getByVersion(writingId, version)
          ).andThen((versionDetail) => {
            if (!versionDetail) {
              return err<WritingVersionDetail, WritingModuleError>(
                writingNotFound(
                  `버전 ${version}을 찾을 수 없습니다.`,
                  writingId
                )
              )
            }
            return ok<WritingVersionDetail, WritingModuleError>(versionDetail)
          })
        )
        .exhaustive()
    )
  }
}
