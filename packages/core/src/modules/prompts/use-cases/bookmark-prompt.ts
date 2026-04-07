import { err, ok, ResultAsync } from "neverthrow"

import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../prompt-error"

export type BookmarkPromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeBookmarkPromptUseCase(deps: BookmarkPromptDeps) {
  return (
    userId: UserId,
    promptId: PromptId
  ): ResultAsync<{ savedAt: string }, PromptModuleError> =>
    ResultAsync.fromSafePromise(
      deps.promptRepository.bookmark(userId, promptId)
    ).andThen((result) =>
      result.kind === "bookmarked"
        ? ok({ savedAt: result.savedAt })
        : err(promptNotFound("글감을 찾을 수 없습니다.", promptId))
    )
}

export type UnbookmarkPromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeUnbookmarkPromptUseCase(deps: UnbookmarkPromptDeps) {
  return (userId: UserId, promptId: PromptId): ResultAsync<void, never> =>
    ResultAsync.fromSafePromise(
      deps.promptRepository.unbookmark(userId, promptId)
    )
}
