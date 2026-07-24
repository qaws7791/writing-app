import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import type { LearnerLessonStepDto as LessonStep } from "@/shared/http/learner-api-client"

type LessonStepCheckedPresentation =
  | false
  | "correct"
  | "wrong"
  | {
      readonly explanation: string
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }

export function toLessonStepCheckedVisual(
  step: LessonStep,
  checked: LessonStepCheckedState | false
): LessonStepCheckedPresentation {
  if (checked === false) return false
  if (checked.type === "SELECT" && step.type === "SELECT") {
    const indexById = new Map(step.items.map((item, index) => [item.id, index]))
    return {
      explanation: checked.explanation,
      missed: checked.items.flatMap((item) =>
        item.verdict === "missed" ? [indexById.get(item.id) ?? -1] : []
      ),
      wrong: checked.items.flatMap((item) =>
        item.verdict === "incorrect" ? [indexById.get(item.id) ?? -1] : []
      ),
    }
  }
  return "correct" in checked
    ? checked.correct
      ? "correct"
      : "wrong"
    : "correct"
}

export function getCorrectLessonStepItemIds(
  checked: LessonStepCheckedState | false
): readonly string[] {
  return checked !== false && "correctItemIds" in checked
    ? checked.correctItemIds
    : []
}

export function getLessonStepEvaluationExplanation(
  checked: LessonStepCheckedState | false
): string {
  return checked !== false && "explanation" in checked
    ? checked.explanation
    : ""
}

export function findLessonStepItemId<TId extends string>(
  items: readonly { readonly id: TId }[],
  id: string
): TId {
  const item = items.find((candidate) => candidate.id === id)
  if (item === undefined) throw new Error(`선택 항목을 찾을 수 없습니다: ${id}`)
  return item.id
}
