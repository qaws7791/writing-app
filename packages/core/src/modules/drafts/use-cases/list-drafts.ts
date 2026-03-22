import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { DraftSummary } from "../draft-types"
import type { DraftRepository } from "../draft-port"

export type ListDraftsDeps = {
  readonly draftRepository: DraftRepository
}

export function makeListDraftsUseCase(deps: ListDraftsDeps) {
  return (
    userId: UserId,
    limit?: number
  ): ResultAsync<readonly DraftSummary[], never> =>
    ResultAsync.fromSafePromise(deps.draftRepository.list(userId, limit))
}
