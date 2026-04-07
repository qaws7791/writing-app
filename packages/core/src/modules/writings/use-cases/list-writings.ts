import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { WritingSummary } from "../writing-types"
import type { WritingRepository } from "../writing-port"

export type ListWritingsDeps = {
  readonly writingRepository: WritingRepository
}

export type ListWritingsParams = {
  limit?: number
  cursor?: string
}

export function makeListWritingsUseCase(deps: ListWritingsDeps) {
  return (
    userId: UserId,
    params?: ListWritingsParams
  ): ResultAsync<
    { items: WritingSummary[]; nextCursor: string | null },
    never
  > => ResultAsync.fromSafePromise(deps.writingRepository.list(userId, params))
}
