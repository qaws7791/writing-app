import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand"
import type { RevisionComparison } from "../ai-feedback-types"
import type { AiCoachingGateway } from "../ai-feedback-port"

export type CompareRevisionsDeps = {
  readonly aiCoachingGateway: AiCoachingGateway
}

export type CompareRevisionsInput = {
  readonly userId: UserId
  readonly originalText: string
  readonly revisedText: string
}

export function makeCompareRevisionsUseCase(deps: CompareRevisionsDeps) {
  return (
    input: CompareRevisionsInput
  ): ResultAsync<RevisionComparison, never> =>
    // TODO: userId를 사용량 집계 및 남용 탐지에 활용 (AI 호출 로그 DB 저장)
    ResultAsync.fromSafePromise(
      deps.aiCoachingGateway.compareRevisions({
        originalText: input.originalText,
        revisedText: input.revisedText,
      })
    )
}
