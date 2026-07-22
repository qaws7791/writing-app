import type { LearnerLessonStep as LessonStep } from "@workspace/contracts/learning/learner-content"
import type { LessonStepItemId } from "@workspace/contracts/learning/ids"

import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"

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
): readonly LessonStepItemId[] {
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

export function mapLessonStepTextsToItemIds<TId extends string>(
  items: readonly { readonly id: TId; readonly text: string }[],
  texts: readonly string[]
): TId[] {
  const remaining = [...items]
  return texts.map((text) => {
    const index = remaining.findIndex((item) => item.text === text)
    if (index < 0) throw new Error(`선택 항목을 찾을 수 없습니다: ${text}`)
    const [item] = remaining.splice(index, 1)
    if (item === undefined)
      throw new Error(`선택 항목을 찾을 수 없습니다: ${text}`)
    return item.id
  })
}

export function findLessonStepItemId<TId extends string>(
  items: readonly { readonly id: TId }[],
  id: string
): TId {
  const item = items.find((candidate) => candidate.id === id)
  if (item === undefined) throw new Error(`선택 항목을 찾을 수 없습니다: ${id}`)
  return item.id
}
