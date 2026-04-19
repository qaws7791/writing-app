import { ResultAsync } from "neverthrow"

import type { CreatePromptInput, PromptSummary } from "../prompt-types"
import type { PromptRepository } from "../prompt-port"

export type CreatePromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeCreatePromptUseCase(deps: CreatePromptDeps) {
  return (input: CreatePromptInput): ResultAsync<PromptSummary, never> =>
    ResultAsync.fromSafePromise(deps.promptRepository.create(input))
}
