import { ResultAsync } from "neverthrow"

import type { RevisionComparison } from "../ai-feedback-types"
import type { AiCoachingGateway } from "../ai-feedback-port"

export type CompareRevisionsDeps = {
  readonly aiCoachingGateway: AiCoachingGateway
}

export type CompareRevisionsInput = {
  readonly originalText: string
  readonly revisedText: string
}

export function makeCompareRevisionsUseCase(deps: CompareRevisionsDeps) {
  return (
    input: CompareRevisionsInput
  ): ResultAsync<RevisionComparison, never> =>
    ResultAsync.fromSafePromise(
      deps.aiCoachingGateway.compareRevisions({
        originalText: input.originalText,
        revisedText: input.revisedText,
      })
    )
}
