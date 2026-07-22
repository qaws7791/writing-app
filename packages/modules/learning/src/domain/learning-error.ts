import type { StepEvaluation } from "#learning/domain/learning-types"
import type { LearnerTransitionError } from "#learning/domain/learner-transition"

export type AnswerRejectedFailure = Readonly<{
  evaluation: StepEvaluation
  kind: "answer-rejected"
}>

export type LearningExpectedFailure =
  | AnswerRejectedFailure
  | Readonly<{ kind: "not-found"; resource: "lesson" }>
  | Readonly<{
      conflict: "curriculum-version" | "feedback-answer" | "step-sequence"
      kind: "conflict"
    }>
  | Readonly<{
      kind: "invalid-transition"
      reason: "feedback-target" | "invalid-request" | "lesson-locked"
    }>

export function createAnswerRejectedFailure(
  evaluation: StepEvaluation
): AnswerRejectedFailure {
  return Object.freeze({ evaluation, kind: "answer-rejected" })
}

export function classifyLearningTransitionError(
  error: LearnerTransitionError
): Exclude<LearningExpectedFailure, AnswerRejectedFailure> {
  switch (error.kind) {
    case "lesson-not-found":
      return Object.freeze({ kind: "not-found", resource: "lesson" })
    case "curriculum-version-changed":
      return Object.freeze({ conflict: "curriculum-version", kind: "conflict" })
    case "feedback-answer-not-found":
      return Object.freeze({ conflict: "feedback-answer", kind: "conflict" })
    case "step-sequence-conflict":
      return Object.freeze({ conflict: "step-sequence", kind: "conflict" })
    case "feedback-target-invalid":
      return Object.freeze({
        kind: "invalid-transition",
        reason: "feedback-target",
      })
    case "invalid-request":
      return Object.freeze({
        kind: "invalid-transition",
        reason: "invalid-request",
      })
    case "lesson-locked":
      return Object.freeze({
        kind: "invalid-transition",
        reason: "lesson-locked",
      })
  }
}
