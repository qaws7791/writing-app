import type { LearnerLessonStep } from "#contracts/learning/learner-content"
import type {
  LearnerStepSubmission,
  StepEvaluation,
  StepItemVerdict,
} from "#contracts/learning/learner-step-answer"

export function evaluateStepSubmission(
  step: LearnerLessonStep,
  submission: LearnerStepSubmission
): StepEvaluation | null {
  switch (submission.type) {
    case "MULTIPLE_CHOICE":
      return step.type === "MULTIPLE_CHOICE"
        ? evaluateMultipleChoice(step, submission)
        : null
    case "FILL_BLANK":
      return step.type === "FILL_BLANK"
        ? evaluateFillBlank(step, submission)
        : null
    case "SELECT":
      return step.type === "SELECT" ? evaluateSelect(step, submission) : null
    case "ORDER":
      return step.type === "ORDER" ? evaluateOrder(step, submission) : null
    case "MATCH":
      return step.type === "MATCH" ? evaluateMatch(step, submission) : null
    case "CATEGORIZE":
      return step.type === "CATEGORIZE"
        ? evaluateCategorize(step, submission)
        : null
    case "TRUE_FALSE":
      return step.type === "TRUE_FALSE"
        ? evaluateTrueFalse(step, submission)
        : null
    case "SENTENCE_BUILD":
      return step.type === "SENTENCE_BUILD"
        ? evaluateSentenceBuild(step, submission)
        : null
    case "ERROR_CORRECT":
      return step.type === "ERROR_CORRECT"
        ? evaluateErrorCorrect(step, submission)
        : null
    default:
      return null
  }
}

function evaluateMultipleChoice(
  step: Extract<LearnerLessonStep, { readonly type: "MULTIPLE_CHOICE" }>,
  submission: Extract<
    LearnerStepSubmission,
    { readonly type: "MULTIPLE_CHOICE" }
  >
): StepEvaluation | null {
  if (!step.options.some((opt) => opt.id === submission.selectedOptionId)) {
    return null
  }
  const correct = submission.selectedOptionId === step.correct
  return {
    correct,
    correctItemIds: [step.correct],
    explanation: step.explanation,
    items: step.options.map((opt) => ({
      id: opt.id,
      verdict: itemVerdict(
        opt.id === submission.selectedOptionId,
        opt.id === step.correct
      ),
    })),
    type: "MULTIPLE_CHOICE",
  }
}

function evaluateFillBlank(
  step: Extract<LearnerLessonStep, { readonly type: "FILL_BLANK" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "FILL_BLANK" }>
): StepEvaluation | null {
  const choiceIds = step.choices.map((c) => c.id)
  if (
    submission.selectedChoiceIds.length !== step.answer.length ||
    !hasUniqueValues(submission.selectedChoiceIds) ||
    submission.selectedChoiceIds.some((id) => !choiceIds.includes(id))
  ) {
    return null
  }
  const correct = equalValues(submission.selectedChoiceIds, step.answer)
  return {
    correct,
    correctItemIds: step.answer,
    explanation: step.explanation,
    items: submission.selectedChoiceIds.map((id, index) => ({
      id,
      verdict: id === step.answer[index] ? "correct" : "incorrect",
    })),
    type: "FILL_BLANK",
  }
}

function evaluateSelect(
  step: Extract<LearnerLessonStep, { readonly type: "SELECT" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "SELECT" }>
): StepEvaluation | null {
  const itemIds = step.items.map((i) => i.id)
  if (
    !hasUniqueValues(submission.selectedItemIds) ||
    submission.selectedItemIds.some((id) => !itemIds.includes(id))
  ) {
    return null
  }
  const correct = sameValueSet(submission.selectedItemIds, step.correct)
  const selectedIds = new Set(submission.selectedItemIds)
  return {
    correct,
    correctItemIds: step.correct,
    explanation: step.explanation,
    items: itemIds.map((id) => ({
      id,
      verdict: itemVerdict(selectedIds.has(id), step.correct.includes(id)),
    })),
    type: "SELECT",
  }
}

function evaluateOrder(
  step: Extract<LearnerLessonStep, { readonly type: "ORDER" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "ORDER" }>
): StepEvaluation | null {
  const itemIds = step.items.map((i) => i.id)
  if (
    submission.orderedItemIds.length !== itemIds.length ||
    !hasUniqueValues(submission.orderedItemIds) ||
    submission.orderedItemIds.some((id) => !itemIds.includes(id))
  ) {
    return null
  }
  const correct = equalValues(submission.orderedItemIds, step.correct)
  return {
    correct,
    correctItemIds: step.correct,
    explanation: step.explanation,
    items: submission.orderedItemIds.map((id, index) => ({
      id,
      verdict: id === step.correct[index] ? "correct" : "incorrect",
    })),
    type: "ORDER",
  }
}

function evaluateMatch(
  step: Extract<LearnerLessonStep, { readonly type: "MATCH" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "MATCH" }>
): StepEvaluation | null {
  const leftIds = step.pairs.map((p) => p.leftId)
  const rightIds = step.pairs.map((p) => p.rightId)
  if (
    submission.pairs.length !== step.pairs.length ||
    !hasUniqueValues(submission.pairs.map((p) => p.leftItemId)) ||
    !hasUniqueValues(submission.pairs.map((p) => p.rightItemId)) ||
    submission.pairs.some(
      (p) =>
        !leftIds.includes(p.leftItemId) || !rightIds.includes(p.rightItemId)
    )
  ) {
    return null
  }
  const expectedByLeftId = new Map(step.pairs.map((p) => [p.leftId, p.rightId]))
  const items = submission.pairs.map((pair) => {
    const expectedRightItemId = expectedByLeftId.get(pair.leftItemId)
    if (expectedRightItemId === undefined) {
      throw new Error("Missing pair match")
    }
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
  return {
    correct,
    explanation: step.explanation,
    items,
    type: "MATCH",
  }
}

function evaluateCategorize(
  step: Extract<LearnerLessonStep, { readonly type: "CATEGORIZE" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "CATEGORIZE" }>
): StepEvaluation | null {
  const itemIds = step.items.map((i) => i.id)
  const categoryIds = step.categories.map((c) => c.id)
  if (
    submission.assignments.length !== step.items.length ||
    !hasUniqueValues(submission.assignments.map((a) => a.itemId)) ||
    submission.assignments.some(
      (a) => !itemIds.includes(a.itemId) || !categoryIds.includes(a.categoryId)
    )
  ) {
    return null
  }
  const expectedByItemId = new Map(
    step.items.map((item) => [item.id, item.categoryId])
  )
  const items = submission.assignments.map((item) => {
    const expectedCategoryId = expectedByItemId.get(item.itemId)
    if (expectedCategoryId === undefined) {
      throw new Error("Missing category mapping")
    }
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
  return {
    correct,
    explanation: step.explanation,
    items,
    type: "CATEGORIZE",
  }
}

function evaluateTrueFalse(
  step: Extract<LearnerLessonStep, { readonly type: "TRUE_FALSE" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "TRUE_FALSE" }>
): StepEvaluation {
  const correct = submission.selectedAnswer === step.correct
  return {
    correct,
    correctAnswer: step.correct,
    explanation: step.explanation,
    type: "TRUE_FALSE",
  }
}

function evaluateSentenceBuild(
  step: Extract<LearnerLessonStep, { readonly type: "SENTENCE_BUILD" }>,
  submission: Extract<
    LearnerStepSubmission,
    { readonly type: "SENTENCE_BUILD" }
  >
): StepEvaluation | null {
  const tileIds = step.tiles.map((t) => t.id)
  if (
    submission.selectedTileIds.length !== step.correct.length ||
    !hasUniqueValues(submission.selectedTileIds) ||
    submission.selectedTileIds.some((id) => !tileIds.includes(id))
  ) {
    return null
  }
  const correct = equalValues(submission.selectedTileIds, step.correct)
  return {
    correct,
    correctItemIds: step.correct,
    explanation: step.explanation,
    items: submission.selectedTileIds.map((id, index) => ({
      id,
      verdict: id === step.correct[index] ? "correct" : "incorrect",
    })),
    type: "SENTENCE_BUILD",
  }
}

function evaluateErrorCorrect(
  step: Extract<LearnerLessonStep, { readonly type: "ERROR_CORRECT" }>,
  submission: Extract<LearnerStepSubmission, { readonly type: "ERROR_CORRECT" }>
): StepEvaluation | null {
  const segmentIds = step.segments.map((s) => s.id)
  const fixIds = step.fixes.map((f) => f.id)
  if (
    !segmentIds.includes(submission.selectedSegmentId) ||
    !fixIds.includes(submission.selectedFixId)
  ) {
    return null
  }
  const correct =
    submission.selectedSegmentId === step.correctSegment &&
    submission.selectedFixId === step.correctFix
  return {
    correct,
    correctFixId: step.correctFix,
    correctSegmentId: step.correctSegment,
    explanation: step.explanation,
    type: "ERROR_CORRECT",
  }
}

function itemVerdict(selected: boolean, expected: boolean): StepItemVerdict {
  if (selected && expected) return "correct"
  if (selected) return "incorrect"
  if (expected) return "missed"
  return "correct"
}

function equalValues(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function sameValueSet(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  )
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}
