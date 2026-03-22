import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { PromptListFilters, PromptSummary } from "../prompt-types"
import type { PromptRepository } from "../prompt-port"

export type ListPromptsDeps = {
  readonly promptRepository: PromptRepository
}

export function makeListPromptsUseCase(deps: ListPromptsDeps) {
  return (
    userId: UserId,
    filters: PromptListFilters
  ): ResultAsync<readonly PromptSummary[], never> =>
    ResultAsync.fromSafePromise(deps.promptRepository.list(userId, filters))
}
