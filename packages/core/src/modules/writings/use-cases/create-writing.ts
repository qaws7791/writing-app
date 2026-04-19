import { ResultAsync } from "neverthrow"

import type { PromptId, SessionId, UserId } from "../../../shared/brand/index"
import type { RepositoryTransactionManager } from "../../../shared/transaction/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-port"

export type CreateWritingInput = {
  readonly title?: string
  readonly bodyJson?: unknown
  readonly bodyPlainText?: string
  readonly wordCount?: number
  readonly sourcePromptId?: PromptId
  readonly sourceSessionId?: SessionId
}

export type CreateWritingDeps = {
  readonly writingRepository: WritingRepository
  readonly transactionManager: RepositoryTransactionManager
}

export function makeCreateWritingUseCase(deps: CreateWritingDeps) {
  return (
    userId: UserId,
    input: CreateWritingInput
  ): ResultAsync<WritingDetail, never> =>
    ResultAsync.fromSafePromise(
      deps.transactionManager.run(async ({ writingRepository }) =>
        writingRepository.create(userId, {
          title: input.title ?? "",
          bodyJson: input.bodyJson ?? null,
          bodyPlainText: input.bodyPlainText ?? "",
          wordCount: input.wordCount ?? 0,
          sourcePromptId: input.sourcePromptId ?? null,
          sourceSessionId: input.sourceSessionId ?? null,
        })
      )
    )
}
