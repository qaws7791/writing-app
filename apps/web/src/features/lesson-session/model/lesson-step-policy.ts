import type {
  LearnerLessonStepDto,
  LearnerStepDraftAnswerDto,
  LearnerStepEvaluationDto,
} from "@/shared/http/learner-api-client"

export type LessonStepCheckedState = NonNullable<LearnerStepEvaluationDto>

export function isLessonStepSubmittable(
  step: LearnerLessonStepDto,
  payload: LearnerStepDraftAnswerDto | undefined
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
    case "WRITE":
      return payload?.type === "WRITE" && payload.text.length >= step.min
    case "COMPARE":
    case "READING":
      return true
  }
}

export function getLessonStepActionLabel(step: LearnerLessonStepDto): string {
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
