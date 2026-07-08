import type { LessonStepAnswerPayload } from "@/features/step-debug/step-logic"
import type {
  CategorizeStep,
  FillBlankStep,
  MatchStep,
  MultipleChoiceStep,
  OrderStep,
  SelectStep,
  LessonStep,
} from "@/features/step-debug/step-types"

type CheckableStepType =
  | "CATEGORIZE"
  | "FILL_BLANK"
  | "MATCH"
  | "MULTIPLE_CHOICE"
  | "ORDER"
  | "SELECT"

export type CheckableLessonStep = Extract<
  LessonStep,
  { readonly type: CheckableStepType }
>

export type LessonStepCheckedState =
  | "correct"
  | "wrong"
  | {
      readonly explanation?: string
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
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

export function isLessonStepCheckable(
  step: LessonStep
): step is CheckableLessonStep {
  return (
    step.type === "CATEGORIZE" ||
    step.type === "FILL_BLANK" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "ORDER" ||
    step.type === "SELECT"
  )
}

export function getLessonStepCheckedResult(
  step: CheckableLessonStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  switch (step.type) {
    case "CATEGORIZE":
      return checkPolicyByStepType.CATEGORIZE(step, payload)
    case "FILL_BLANK":
      return checkPolicyByStepType.FILL_BLANK(step, payload)
    case "MATCH":
      return checkPolicyByStepType.MATCH(step, payload)
    case "MULTIPLE_CHOICE":
      return checkPolicyByStepType.MULTIPLE_CHOICE(step, payload)
    case "ORDER":
      return checkPolicyByStepType.ORDER(step, payload)
    case "SELECT":
      return checkPolicyByStepType.SELECT(step, payload)
  }
}

const checkPolicyByStepType = {
  CATEGORIZE: getCategorizeCheckedResult,
  FILL_BLANK: getFillBlankCheckedResult,
  MATCH: getMatchCheckedResult,
  MULTIPLE_CHOICE: getMultipleChoiceCheckedResult,
  ORDER: getOrderCheckedResult,
  SELECT: getSelectCheckedResult,
} satisfies {
  readonly [TType in CheckableStepType]: (
    step: Extract<CheckableLessonStep, { readonly type: TType }>,
    payload: LessonStepAnswerPayload | undefined
  ) => LessonStepCheckedState
}

function getCategorizeCheckedResult(
  step: CategorizeStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  if (payload?.type !== "CATEGORIZE") {
    return "wrong"
  }

  if (payload.items.length !== step.items.length) {
    return "wrong"
  }

  const isCorrect = step.items.every((item) =>
    payload.items.some(
      (placement) =>
        placement.itemId === item.id && placement.categoryId === item.categoryId
    )
  )

  return isCorrect ? "correct" : "wrong"
}

function getFillBlankCheckedResult(
  step: FillBlankStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  if (payload?.type !== "FILL_BLANK") {
    return "wrong"
  }

  return areOrderedValuesEqual(payload.selectedWords, step.answer)
    ? "correct"
    : "wrong"
}

function getMatchCheckedResult(
  step: MatchStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  if (payload?.type !== "MATCH") {
    return "wrong"
  }

  if (payload.pairs.length !== step.pairs.length) {
    return "wrong"
  }

  const isCorrect = step.pairs.every((pair) =>
    payload.pairs.some(
      (selectedPair) =>
        selectedPair.left === pair.left && selectedPair.right === pair.right
    )
  )

  return isCorrect ? "correct" : "wrong"
}

function getMultipleChoiceCheckedResult(
  step: MultipleChoiceStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  if (payload?.type !== "MULTIPLE_CHOICE") {
    return "wrong"
  }

  return payload.selectedOptionId === step.correct ? "correct" : "wrong"
}

function getOrderCheckedResult(
  step: OrderStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  if (payload?.type !== "ORDER") {
    return "wrong"
  }

  return areOrderedValuesEqual(payload.orderedItems, step.correct)
    ? "correct"
    : "wrong"
}

function getSelectCheckedResult(
  step: SelectStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  if (payload?.type !== "SELECT") {
    return "wrong"
  }

  const selected = new Set(payload.selectedIndexes)
  const correct = new Set(step.correct)

  return {
    explanation: step.explanation,
    missed: [...correct].filter((index) => !selected.has(index)),
    wrong: [...selected].filter((index) => !correct.has(index)),
  }
}

function areOrderedValuesEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
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
