import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftDetail } from "../draft-types"
import type { DraftRepository } from "../draft-port"
import {
  draftForbidden,
  draftNotFound,
  type DraftModuleError,
} from "../draft-error"

export type GetDraftDeps = {
  readonly draftRepository: DraftRepository
}

export function makeGetDraftUseCase(deps: GetDraftDeps) {
  return (
    userId: UserId,
    draftId: DraftId
  ): ResultAsync<DraftDetail, DraftModuleError> =>
    ResultAsync.fromSafePromise(
      deps.draftRepository.getById(userId, draftId)
    ).andThen((result) =>
      match(result)
        .with({ kind: "draft" }, ({ draft }) => ok(draft))
        .with({ kind: "not-found" }, () =>
          err(draftNotFound("초안을 찾을 수 없습니다.", draftId))
        )
        .with({ kind: "forbidden" }, ({ ownerId }) =>
          err(
            draftForbidden(
              "다른 사용자의 초안에는 접근할 수 없습니다.",
              ownerId
            )
          )
        )
        .exhaustive()
    )
}
