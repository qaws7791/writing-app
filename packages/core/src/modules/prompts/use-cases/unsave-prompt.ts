import { err, ok, ResultAsync } from "neverthrow"

import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../prompt-error"

export type UnsavePromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeUnsavePromptUseCase(deps: UnsavePromptDeps) {
  return (
    userId: UserId,
    promptId: PromptId
  ): ResultAsync<void, PromptModuleError> =>
    ResultAsync.fromSafePromise(
      deps.promptRepository.unsave(userId, promptId)
    ).andThen((existed) =>
      existed
        ? ok(undefined)
        : err(promptNotFound("저장된 글감을 찾을 수 없습니다.", promptId))
    )
}
