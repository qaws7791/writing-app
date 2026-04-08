import { ResultAsync } from "neverthrow"

import type { PromptId, UserId } from "../../../shared/brand/index"
import type {
  PublicWritingSummary,
  ListPromptWritingsParams,
} from "../writing-types"
import type { WritingRepository } from "../writing-port"

export type ListPromptWritingsDeps = {
  readonly writingRepository: WritingRepository
}

export function makeListPromptWritingsUseCase(deps: ListPromptWritingsDeps) {
  return (
    promptId: PromptId,
    userId: UserId | null,
    params?: ListPromptWritingsParams
  ): ResultAsync<
    {
      items: PublicWritingSummary[]
      nextCursor: string | null
      hasMore: boolean
    },
    never
  > =>
    ResultAsync.fromSafePromise(
      deps.writingRepository.listByPrompt(promptId, userId, params)
    )
}
