import { ResultAsync } from "neverthrow"

import type { PromptId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"

export type DeletePromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeDeletePromptUseCase(deps: DeletePromptDeps) {
  return (promptId: PromptId): ResultAsync<void, never> =>
    ResultAsync.fromSafePromise(deps.promptRepository.delete(promptId))
}
