import type { LearnerLessonStep } from "@workspace/contracts/learning/learner-content"
import type {
  LearnerStepSubmission,
  StepEvaluation,
} from "@workspace/contracts/learning/learner-transition"

export type LessonStepCheckedState = StepEvaluation

export function isLessonStepSubmittable(
  step: LearnerLessonStep,
  payload: LearnerStepSubmission | undefined
): boolean {
  switch (step.type) {
    case "AI_FEEDBACK":
      return false
    case "CATEGORIZE":
      return (
        payload?.type === "CATEGORIZE" &&
        payload.assignments.length === step.items.length
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
      return payload?.type === "MULTIPLE_CHOICE"
    case "ORDER":
      return (
        payload?.type === "ORDER" &&
        payload.orderedItemIds.length === step.items.length
      )
    case "SELECT":
      return payload?.type === "SELECT" && payload.selectedItemIds.length > 0
    case "WRITE":
      return payload?.type === "WRITE" && payload.text.length >= step.min
    case "COMPARE":
    case "READING":
      return true
  }
}

export function getLessonStepActionLabel(step: LearnerLessonStep): string {
  return step.type === "READING" || step.type === "COMPARE"
    ? "이해했어요"
    : step.type === "AI_FEEDBACK"
      ? "다음으로 →"
      : "확인하기"
}

export function isLessonStepCheckedCorrect(
  checked: LessonStepCheckedState
): boolean {
  return "correct" in checked ? checked.correct : checked.accepted
}
