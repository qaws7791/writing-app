import type {
  LessonStep,
  LessonStepDraftAnswer,
  LessonStepEvaluation,
} from "@/features/lesson-session/model/lesson-view-model"

export type LessonStepCheckedState = NonNullable<LessonStepEvaluation>

export function isLessonStepSubmittable(
  step: LessonStep,
  payload: LessonStepDraftAnswer | undefined
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

export function getLessonStepActionLabel(step: LessonStep): string {
  return step.type === "READING" || step.type === "COMPARE"
    ? "이해했어요"
    : "확인하기"
}

export function getLessonStepPendingLabel(step: LessonStep): string {
  return step.type === "READING" || step.type === "COMPARE"
    ? "계속하는 중…"
    : "확인하는 중…"
}

export function isLessonStepCheckedCorrect(
  checked: LessonStepCheckedState
): boolean {
  return checked.correct
}

export function lessonCompletedProgressPercent(
  currentStepIndex: number,
  totalStepCount: number
): number {
  if (totalStepCount <= 0) return 0
  return Math.round((currentStepIndex / totalStepCount) * 100)
}
