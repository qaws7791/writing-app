import type {
  LearnerStepSubmission,
  LearningStep,
  StepEvaluation,
  StepItemVerdict,
} from "#learning/domain/learning-types"

import type { LearnerStepCompletion } from "#learning/domain/learner-transition"

export type StepGradingResult =
  | { readonly kind: "invalid" }
  | { readonly evaluation: StepEvaluation; readonly kind: "retry" }
  | {
      readonly answer: LearnerStepSubmission | null
      readonly evaluation: StepEvaluation | null
      readonly kind: "accepted"
    }

export function gradeLearnerStep(
  step: LearningStep,
  completion: LearnerStepCompletion
): StepGradingResult {
  if (completion.kind === "acknowledge") {
    return step.type === "READING" || step.type === "COMPARE"
      ? { answer: null, evaluation: null, kind: "accepted" }
      : { kind: "invalid" }
  }
  switch (completion.submission.type) {
    case "MULTIPLE_CHOICE":
      return step.type === completion.submission.type
        ? gradeMultipleChoice(step, completion.submission)
        : { kind: "invalid" }
    case "FILL_BLANK":
      return step.type === completion.submission.type
        ? gradeFillBlank(step, completion.submission)
        : { kind: "invalid" }
    case "SELECT":
      return step.type === completion.submission.type
        ? gradeSelect(step, completion.submission)
        : { kind: "invalid" }
    case "ORDER":
      return step.type === completion.submission.type
        ? gradeOrder(step, completion.submission)
        : { kind: "invalid" }
    case "MATCH":
      return step.type === completion.submission.type
        ? gradeMatch(step, completion.submission)
        : { kind: "invalid" }
    case "CATEGORIZE":
      return step.type === completion.submission.type
        ? gradeCategorize(step, completion.submission)
        : { kind: "invalid" }
  }
}

function gradeMultipleChoice(
  step: Extract<LearningStep, { readonly type: "MULTIPLE_CHOICE" }>,
  answer: Extract<LearnerStepSubmission, { readonly type: "MULTIPLE_CHOICE" }>
): StepGradingResult {
  if (!step.options.some((option) => option.id === answer.selectedOptionId)) {
    return { kind: "invalid" }
  }

  const correct = answer.selectedOptionId === step.correct
  return evaluatedResult(answer, correct, {
    correct,
    correctItemIds: [step.correct],
    explanation: step.explanation,
    items: step.options.map((option) => ({
      id: option.id,
      verdict: itemVerdict(
        option.id === answer.selectedOptionId,
        option.id === step.correct
      ),
    })),
    type: step.type,
  })
}

function gradeFillBlank(
  step: Extract<LearningStep, { readonly type: "FILL_BLANK" }>,
  answer: Extract<LearnerStepSubmission, { readonly type: "FILL_BLANK" }>
): StepGradingResult {
  const ids = step.wordIds
  if (ids.length !== step.words.length) {
    throw new Error(`Missing stable choice IDs for ${step.id}`)
  }
  if (
    answer.selectedChoiceIds.length !== step.answer.length ||
    !hasUniqueValues(answer.selectedChoiceIds) ||
    answer.selectedChoiceIds.some((id) => !ids.includes(id))
  ) {
    return { kind: "invalid" }
  }

  const correctIds = step.answer
  const correct = equalValues(answer.selectedChoiceIds, correctIds)
  return evaluatedResult(answer, correct, {
    correct,
    correctItemIds: correctIds,
    explanation: step.explanation,
    items: answer.selectedChoiceIds.map((id, index) => ({
      id,
      verdict: id === correctIds[index] ? "correct" : "incorrect",
    })),
    type: step.type,
  })
}

function gradeSelect(
  step: Extract<LearningStep, { readonly type: "SELECT" }>,
  answer: Extract<LearnerStepSubmission, { readonly type: "SELECT" }>
): StepGradingResult {
  const ids = step.segmentIds
  if (ids.length !== step.segments.length) {
    throw new Error(`Missing stable item IDs for ${step.id}`)
  }
  if (
    !hasUniqueValues(answer.selectedItemIds) ||
    answer.selectedItemIds.some((id) => !ids.includes(id))
  ) {
    return { kind: "invalid" }
  }

  const expected = step.correct
  const correct = sameValueSet(answer.selectedItemIds, expected)
  const selectedIds = new Set<string>(answer.selectedItemIds)
  return evaluatedResult(answer, correct, {
    correct,
    correctItemIds: expected,
    explanation: step.explanation,
    items: ids.map((id) => ({
      id,
      verdict: itemVerdict(selectedIds.has(id), expected.includes(id)),
    })),
    type: step.type,
  })
}

function gradeOrder(
  step: Extract<LearningStep, { readonly type: "ORDER" }>,
  answer: Extract<LearnerStepSubmission, { readonly type: "ORDER" }>
): StepGradingResult {
  const ids = step.itemIds
  if (ids.length !== step.items.length) {
    throw new Error(`Missing stable item IDs for ${step.id}`)
  }
  if (
    answer.orderedItemIds.length !== ids.length ||
    !hasUniqueValues(answer.orderedItemIds) ||
    answer.orderedItemIds.some((id) => !ids.includes(id))
  ) {
    return { kind: "invalid" }
  }

  const correctIds = step.correct
  const correct = equalValues(answer.orderedItemIds, correctIds)
  return evaluatedResult(answer, correct, {
    correct,
    correctItemIds: correctIds,
    explanation: step.explanation,
    items: answer.orderedItemIds.map((id, index) => ({
      id,
      verdict: id === correctIds[index] ? "correct" : "incorrect",
    })),
    type: step.type,
  })
}

function gradeMatch(
  step: Extract<LearningStep, { readonly type: "MATCH" }>,
  answer: Extract<LearnerStepSubmission, { readonly type: "MATCH" }>
): StepGradingResult {
  const solution = step.pairs.map((pair) => {
    return { leftItemId: pair.leftId, rightItemId: pair.rightId }
  })
  const leftIds = solution.map((pair) => pair.leftItemId)
  const rightIds = solution.map((pair) => pair.rightItemId)
  if (
    answer.pairs.length !== solution.length ||
    !hasUniqueValues(answer.pairs.map((pair) => pair.leftItemId)) ||
    !hasUniqueValues(answer.pairs.map((pair) => pair.rightItemId)) ||
    answer.pairs.some(
      (pair) =>
        !leftIds.includes(pair.leftItemId) ||
        !rightIds.includes(pair.rightItemId)
    )
  ) {
    return { kind: "invalid" }
  }

  const expectedByLeftId = new Map(
    solution.map((pair) => [pair.leftItemId, pair.rightItemId])
  )
  const items = answer.pairs.map((pair) => {
    const expectedRightItemId = expectedByLeftId.get(pair.leftItemId)
    if (expectedRightItemId === undefined) throw new Error("Missing pair")
    return {
      expectedRightItemId,
      ...pair,
      verdict:
        pair.rightItemId === expectedRightItemId
          ? ("correct" as const)
          : ("incorrect" as const),
    }
  })
  const correct = items.every((item) => item.verdict === "correct")
  return evaluatedResult(answer, correct, {
    correct,
    explanation: step.explanation,
    items,
    type: step.type,
  })
}

function gradeCategorize(
  step: Extract<LearningStep, { readonly type: "CATEGORIZE" }>,
  answer: Extract<LearnerStepSubmission, { readonly type: "CATEGORIZE" }>
): StepGradingResult {
  const itemIds = step.items.map((item) => item.id)
  const categoryIds = step.categories.map((category) => category.id)
  if (
    answer.assignments.length !== step.items.length ||
    !hasUniqueValues(answer.assignments.map((item) => item.itemId)) ||
    answer.assignments.some(
      (item) =>
        !itemIds.includes(item.itemId) || !categoryIds.includes(item.categoryId)
    )
  ) {
    return { kind: "invalid" }
  }

  const expectedByItemId = new Map(
    step.items.map((item) => [item.id, item.categoryId])
  )
  const items = answer.assignments.map((item) => {
    const expectedCategoryId = expectedByItemId.get(item.itemId)
    if (expectedCategoryId === undefined) throw new Error("Missing category")
    return {
      expectedCategoryId,
      ...item,
      verdict:
        item.categoryId === expectedCategoryId
          ? ("correct" as const)
          : ("incorrect" as const),
    }
  })
  const correct = items.every((item) => item.verdict === "correct")
  return evaluatedResult(answer, correct, {
    correct,
    explanation: step.explanation,
    items,
    type: step.type,
  })
}

function evaluatedResult(
  answer: LearnerStepSubmission,
  correct: boolean,
  evaluation: StepEvaluation
): StepGradingResult {
  return correct
    ? { answer, evaluation, kind: "accepted" }
    : { evaluation, kind: "retry" }
}

function itemVerdict(selected: boolean, expected: boolean): StepItemVerdict {
  if (selected && expected) return "correct"
  if (selected) return "incorrect"
  if (expected) return "missed"
  return "correct"
}

function equalValues(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function sameValueSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  )
}

function hasUniqueValues(values: readonly string[]) {
  return new Set(values).size === values.length
}
