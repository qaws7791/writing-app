import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type {
  CursorPage,
  CursorPageParams,
} from "../../../shared/pagination/index"
import type { WritingSummary } from "../writing-types"
import type { WritingRepository } from "../writing-port"

export type ListWritingsDeps = {
  readonly writingRepository: WritingRepository
}

export function makeListWritingsUseCase(deps: ListWritingsDeps) {
  return (
    userId: UserId,
    params?: CursorPageParams
  ): ResultAsync<CursorPage<WritingSummary>, never> =>
    ResultAsync.fromSafePromise(deps.writingRepository.list(userId, params))
}
