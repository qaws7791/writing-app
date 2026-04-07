import { err, ok, ResultAsync } from "neverthrow"

import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptSummary } from "../prompt-types"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../prompt-error"

export type GetPromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeGetPromptUseCase(deps: GetPromptDeps) {
  return (
    promptId: PromptId,
    userId: UserId | null
  ): ResultAsync<PromptSummary, PromptModuleError> =>
    ResultAsync.fromSafePromise(
      deps.promptRepository.getById(promptId, userId)
    ).andThen((prompt) =>
      prompt !== null
        ? ok(prompt)
        : err(promptNotFound("글감을 찾을 수 없습니다.", promptId))
    )
}
