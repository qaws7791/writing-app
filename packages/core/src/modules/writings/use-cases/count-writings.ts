import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { WritingRepository } from "../writing-port"

export type CountWritingsDeps = {
  readonly writingRepository: WritingRepository
}

export function makeCountWritingsUseCase(deps: CountWritingsDeps) {
  return (userId: UserId): ResultAsync<number, never> =>
    ResultAsync.fromSafePromise(deps.writingRepository.countByUserId(userId))
}
