import {
  comparisonSessionStepAiStateSchema,
  createValidationError,
  feedbackSessionStepAiStateSchema,
  type RevisionComparison,
  stepResponseMapSchema,
  type WritingFeedback,
} from "@workspace/core"
import type {
  SessionAiResult,
  SessionAiStateKind,
  StepResponseMap,
} from "@workspace/core"

export function parseStepResponsesJson(input: unknown): StepResponseMap {
  const parsed = stepResponseMapSchema.safeParse(input ?? {})

  if (parsed.success) {
    return parsed.data
  }

  throw createValidationError(
    "손상된 세션 응답 데이터입니다.",
    "stepResponsesJson"
  )
}

function parseFeedbackResult(input: unknown): WritingFeedback | null {
  const parsed = feedbackSessionStepAiStateSchema.shape.resultJson.safeParse(
    input ?? null
  )

  if (parsed.success) {
    return parsed.data
  }

  throw createValidationError("손상된 세션 AI 결과 데이터입니다.", "resultJson")
}

function parseComparisonResult(input: unknown): RevisionComparison | null {
  const parsed = comparisonSessionStepAiStateSchema.shape.resultJson.safeParse(
    input ?? null
  )

  if (parsed.success) {
    return parsed.data
  }

  throw createValidationError("손상된 세션 AI 결과 데이터입니다.", "resultJson")
}

export function parseSessionAiResultJson(
  kind: "feedback",
  input: unknown
): WritingFeedback | null
export function parseSessionAiResultJson(
  kind: "comparison",
  input: unknown
): RevisionComparison | null
export function parseSessionAiResultJson(
  kind: SessionAiStateKind,
  input: unknown
): SessionAiResult | null {
  return kind === "feedback"
    ? parseFeedbackResult(input)
    : parseComparisonResult(input)
}
