import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftRepository } from "../draft-port"
import {
  draftForbidden,
  draftNotFound,
  type DraftModuleError,
} from "../draft-error"

export type DeleteDraftDeps = {
  readonly draftRepository: DraftRepository
}

export function makeDeleteDraftUseCase(deps: DeleteDraftDeps) {
  return (
    userId: UserId,
    draftId: DraftId
  ): ResultAsync<void, DraftModuleError> =>
    ResultAsync.fromSafePromise(
      deps.draftRepository.delete(userId, draftId)
    ).andThen((result) =>
      match(result)
        .with({ kind: "deleted" }, () => ok(undefined))
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
