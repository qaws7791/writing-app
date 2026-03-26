import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { WritingSummary } from "../writing-types"
import type { WritingRepository } from "../writing-port"

export type ListWritingsDeps = {
  readonly writingRepository: WritingRepository
}

export function makeListWritingsUseCase(deps: ListWritingsDeps) {
  return (
    userId: UserId,
    limit?: number
  ): ResultAsync<readonly WritingSummary[], never> =>
    ResultAsync.fromSafePromise(deps.writingRepository.list(userId, limit))
}
