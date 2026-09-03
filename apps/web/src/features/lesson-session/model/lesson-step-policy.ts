import type { LearnerLessonStep } from "@workspace/contracts/learning/learner-content"
import type {
  LearnerStepDraftAnswer,
  StepEvaluation,
} from "@workspace/contracts/learning/learner-transition"

export type LessonStepCheckedState = {
  readonly correct: boolean
  readonly evaluation?: StepEvaluation | null | undefined
  readonly explanation?: string | undefined
}

export type LessonStepSubmissionMode = "instant" | "manual"

export function getLessonStepSubmissionMode(
  step: LearnerLessonStep
): LessonStepSubmissionMode {
  switch (step.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE":
      return "instant"
    case "CATEGORIZE":
    case "COMPARE":
    case "ERROR_CORRECT":
    case "FILL_BLANK":
    case "MATCH":
    case "ORDER":
    case "READING":
    case "SELECT":
    case "SENTENCE_BUILD":
      return "manual"
  }
}

export function isLessonStepSubmittable(
  step: LearnerLessonStep,
  payload: LearnerStepDraftAnswer | undefined
): boolean {
  switch (step.type) {
    case "CATEGORIZE":
      return (
        payload?.type === "CATEGORIZE" &&
        payload.assignments.length === step.items.length
      )
    case "ERROR_CORRECT":
      return (
        payload?.type === "ERROR_CORRECT" &&
        payload.selectedSegmentId !== null &&
        payload.selectedFixId !== null
      )
    case "FILL_BLANK":
      return (
        payload?.type === "FILL_BLANK" &&
        payload.selectedChoiceIds.length === step.blankCount
      )
    case "MATCH":
      return (
        payload?.type === "MATCH" &&
        payload.pairs.length === step.leftItems.length
      )
    case "MULTIPLE_CHOICE":
      return (
        payload?.type === "MULTIPLE_CHOICE" && payload.selectedOptionId !== null
      )
    case "ORDER":
      return (
        payload?.type === "ORDER" &&
        payload.orderedItemIds.length === step.items.length
      )
    case "SELECT":
      return payload?.type === "SELECT" && payload.selectedItemIds.length > 0
    case "SENTENCE_BUILD":
      return (
        payload?.type === "SENTENCE_BUILD" &&
        payload.selectedTileIds.length === step.tileCount
      )
    case "TRUE_FALSE":
      return payload?.type === "TRUE_FALSE" && payload.selectedAnswer !== null
    case "COMPARE":
    case "READING":
      return true
  }
}

export function getLessonStepActionLabel(step: LearnerLessonStep): string {
  return step.type === "READING" || step.type === "COMPARE"
    ? "이해했어요"
    : "확인하기"
}

export function getLessonStepPendingLabel(step: LearnerLessonStep): string {
  return step.type === "READING" || step.type === "COMPARE"
    ? "계속하는 중…"
    : "확인하는 중…"
}

export function isLessonStepCheckedCorrect(
  checked: LessonStepCheckedState
): boolean {
  return checked.correct
}
