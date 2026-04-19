import { err, ok, ResultAsync } from "neverthrow"

import type { PromptId } from "../../../shared/brand/index"
import type { PromptSummary, UpdatePromptInput } from "../prompt-types"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../prompt-error"

export type UpdatePromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeUpdatePromptUseCase(deps: UpdatePromptDeps) {
  return (
    promptId: PromptId,
    input: UpdatePromptInput
  ): ResultAsync<PromptSummary, PromptModuleError> =>
    ResultAsync.fromSafePromise(
      deps.promptRepository.update(promptId, input)
    ).andThen((updated) =>
      updated !== null
        ? ok(updated)
        : err(promptNotFound("프롬프트를 찾을 수 없습니다.", promptId))
    )
}
