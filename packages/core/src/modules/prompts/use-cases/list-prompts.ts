import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { PromptListFilters, PromptListPage } from "../prompt-types"
import type { PromptRepository } from "../prompt-port"

export type ListPromptsDeps = {
  readonly promptRepository: PromptRepository
}

export function makeListPromptsUseCase(deps: ListPromptsDeps) {
  return (
    userId: UserId | null,
    filters?: PromptListFilters
  ): ResultAsync<PromptListPage, never> =>
    ResultAsync.fromSafePromise(deps.promptRepository.list(userId, filters))
}
