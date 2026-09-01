import type { LessonStepCheckedState } from "@/features/lesson-session/model/lesson-step-policy"
import type { LessonStep } from "@/features/lesson-session/model/lesson-view-model"

type LessonStepCheckedPresentation =
  | false
  | "correct"
  | "wrong"
  | {
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }

export function toLessonStepCheckedVisual(
  step: LessonStep,
  checked: LessonStepCheckedState | false
): LessonStepCheckedPresentation {
  if (checked === false) return false
  const evalState = checked.evaluation
  if (evalState && evalState.type === "SELECT" && step.type === "SELECT") {
    const indexById = new Map(step.items.map((item, index) => [item.id, index]))
    return {
      missed: evalState.items.flatMap((item) =>
        item.verdict === "missed" ? [indexById.get(item.id) ?? -1] : []
      ),
      wrong: evalState.items.flatMap((item) =>
        item.verdict === "incorrect" ? [indexById.get(item.id) ?? -1] : []
      ),
    }
  }
  return checked.correct ? "correct" : "wrong"
}

export function getCorrectLessonStepItemIds(
  checked: LessonStepCheckedState | false
): readonly string[] {
  if (checked === false || !checked.evaluation) return []
  return "correctItemIds" in checked.evaluation
    ? checked.evaluation.correctItemIds
    : []
}

export function findLessonStepItemId<TId extends string>(
  items: readonly { readonly id: TId }[],
  id: string
): TId {
  const item = items.find((candidate) => candidate.id === id)
  if (item === undefined) throw new Error(`선택 항목을 찾을 수 없습니다: ${id}`)
  return item.id
}
