import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../prompt-error"

export type SavePromptDeps = {
  readonly promptRepository: PromptRepository
}

export function makeSavePromptUseCase(deps: SavePromptDeps) {
  return (
    userId: UserId,
    promptId: PromptId
  ): ResultAsync<{ savedAt: string }, PromptModuleError> =>
    ResultAsync.fromSafePromise(
      deps.promptRepository.save(userId, promptId)
    ).andThen((result) =>
      match(result)
        .with({ kind: "saved" }, ({ savedAt }) => ok({ savedAt }))
        .with({ kind: "not-found" }, () =>
          err(promptNotFound("글감을 찾을 수 없습니다.", promptId))
        )
        .exhaustive()
    )
}
