import type { LessonStepAnswerPayload } from "@/features/lessons/lesson-logic"
import type { LessonStep } from "@/features/lessons/lesson-types"

export type LessonStepCheckedState =
  | "correct"
  | "wrong"
  | {
      readonly explanation?: string
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }

export function isLessonStepStandalone(step: LessonStep): boolean {
  return (
    step.type === "CATEGORIZE" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "READING" ||
    step.type === "WRITE"
  )
}

export function getLessonStepTitle(step: LessonStep): string {
  switch (step.type) {
    case "AI_FEEDBACK":
      return "AI 코칭"
    case "CATEGORIZE":
    case "COMPARE":
    case "MATCH":
    case "ORDER":
    case "READING":
      return step.title
    case "FILL_BLANK":
      return "빈칸 채우기"
    case "MULTIPLE_CHOICE":
    case "SELECT":
      return step.question
    case "WRITE":
      return step.title ?? "직접 써보기"
  }
}

export function getLessonStepDescription(step: LessonStep): string {
  switch (step.type) {
    case "AI_FEEDBACK":
      return step.focus
    case "CATEGORIZE":
    case "MATCH":
    case "READING":
    case "WRITE":
      return step.guide
    case "COMPARE":
      return step.analysis
    case "FILL_BLANK":
    case "ORDER":
    case "SELECT":
      return step.explanation
    case "MULTIPLE_CHOICE":
      return "답을 선택하면 해설을 확인합니다."
  }
}

export function isLessonStepSubmittable(
  step: LessonStep,
  payload: LessonStepAnswerPayload | undefined
): boolean {
  switch (step.type) {
    case "AI_FEEDBACK":
      return false
    case "CATEGORIZE":
      return (
        payload?.type === "CATEGORIZE" &&
        payload.items.length === step.items.length
      )
    case "FILL_BLANK":
      return (
        payload?.type === "FILL_BLANK" &&
        payload.selectedWords.filter(Boolean).length === step.answer.length
      )
    case "MATCH":
      return (
        payload?.type === "MATCH" &&
        payload.pairs.length === step.pairs.length &&
        payload.pairs.every((pair) => pair.right !== "")
      )
    case "MULTIPLE_CHOICE":
      return (
        payload?.type === "MULTIPLE_CHOICE" && payload.selectedOptionId !== ""
      )
    case "ORDER":
      return (
        payload?.type === "ORDER" &&
        payload.orderedItems.length === step.items.length
      )
    case "SELECT":
      return payload?.type === "SELECT" && payload.selectedIndexes.length > 0
    case "WRITE":
      return (
        payload?.type === "WRITE" && payload.text.length >= (step.min || 20)
      )
    case "COMPARE":
    case "READING":
      return true
  }
}

export function isLessonStepCheckable(step: LessonStep): boolean {
  return (
    step.type === "FILL_BLANK" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "ORDER" ||
    step.type === "SELECT"
  )
}

export function getLessonStepCheckedResult(
  step: LessonStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  switch (step.type) {
    case "FILL_BLANK":
      return payload?.type === "FILL_BLANK" &&
        JSON.stringify(payload.selectedWords) === JSON.stringify(step.answer)
        ? "correct"
        : "wrong"
    case "MATCH":
      return payload?.type === "MATCH" &&
        step.pairs.every((pair) =>
          payload.pairs.some(
            (selectedPair) =>
              selectedPair.left === pair.left &&
              selectedPair.right === pair.right
          )
        )
        ? "correct"
        : "wrong"
    case "MULTIPLE_CHOICE":
      return payload?.type === "MULTIPLE_CHOICE" &&
        payload.selectedOptionId === step.correct
        ? "correct"
        : "wrong"
    case "ORDER":
      return payload?.type === "ORDER" &&
        JSON.stringify(payload.orderedItems) === JSON.stringify(step.correct)
        ? "correct"
        : "wrong"
    case "SELECT": {
      const selected =
        payload?.type === "SELECT"
          ? new Set(payload.selectedIndexes)
          : new Set<number>()
      const correct = new Set(step.correct)
      const missed = [...correct].filter((index) => !selected.has(index))
      const wrong = [...selected].filter((index) => !correct.has(index))

      return {
        explanation: step.explanation,
        missed,
        wrong,
      }
    }
    default:
      return "correct"
  }
}

export function getLessonStepExplanation(step: LessonStep): string {
  switch (step.type) {
    case "CATEGORIZE":
    case "FILL_BLANK":
    case "MATCH":
    case "MULTIPLE_CHOICE":
    case "ORDER":
    case "SELECT":
      return step.explanation
    case "AI_FEEDBACK":
    case "COMPARE":
    case "READING":
    case "WRITE":
      return ""
  }
}

export function getLessonStepWrongText(step: LessonStep): string | undefined {
  return step.type === "MULTIPLE_CHOICE" ? step.wrong : undefined
}

export function getLessonStepActionLabel(step: LessonStep): string {
  if (step.type === "READING" || step.type === "COMPARE") {
    return "이해했어요"
  }

  if (isLessonStepCheckable(step)) {
    return "확인하기"
  }

  return "다음으로 →"
}
