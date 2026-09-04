import type { LessonStepDto } from "#contracts/content/course"
import type { LessonAuthoringIssue } from "#contracts/content/authoring/authoring-issue"
import { authoringLimits } from "#contracts/content/authoring/authoring-limits"

export function collectAnswerDistributionIssues(input: {
  readonly lessonId: string
  readonly steps: readonly LessonStepDto[]
}): readonly LessonAuthoringIssue[] {
  const issues: LessonAuthoringIssue[] = []
  const { lessonId, steps } = input

  const multipleChoiceSteps = steps.filter(
    (step): step is Extract<LessonStepDto, { type: "MULTIPLE_CHOICE" }> =>
      step.type === "MULTIPLE_CHOICE"
  )
  if (multipleChoiceSteps.length >= 2) {
    const dominantIndex = findDominantValue(
      multipleChoiceSteps.map((step) =>
        step.options.findIndex((option) => option.id === step.correct)
      )
    )
    if (
      dominantIndex !== null &&
      dominantIndex.ratio >= authoringLimits.multipleChoiceCorrectIndexSkewRatio
    ) {
      issues.push({
        message: `MULTIPLE_CHOICE 정답 위치가 ${dominantIndex.value + 1}번째에 ${Math.round(dominantIndex.ratio * 100)}% 몰려 있습니다.`,
        path: lessonId,
        severity: "error",
      })
    }
  }

  const fillBlankSteps = steps.filter(
    (step): step is Extract<LessonStepDto, { type: "FILL_BLANK" }> =>
      step.type === "FILL_BLANK"
  )
  if (fillBlankSteps.length >= 2) {
    const dominantPattern = findDominantValue(
      fillBlankSteps.map((step) => step.answer.join(","))
    )
    if (
      dominantPattern !== null &&
      dominantPattern.ratio >=
        authoringLimits.multipleChoiceCorrectIndexSkewRatio
    ) {
      issues.push({
        message: `FILL_BLANK 정답 패턴이 ${Math.round(dominantPattern.ratio * 100)}% 동일합니다.`,
        path: lessonId,
        severity: "error",
      })
    }
  }

  const trueFalseSteps = steps.filter(
    (step): step is Extract<LessonStepDto, { type: "TRUE_FALSE" }> =>
      step.type === "TRUE_FALSE"
  )
  if (trueFalseSteps.length >= 2) {
    const dominantValue = findDominantValue(
      trueFalseSteps.map((step) => String(step.correct))
    )
    if (
      dominantValue !== null &&
      dominantValue.ratio >= authoringLimits.multipleChoiceCorrectIndexSkewRatio
    ) {
      issues.push({
        message: `TRUE_FALSE 정답이 ${dominantValue.value === "true" ? "참" : "거짓"}으로 ${Math.round(dominantValue.ratio * 100)}% 몰려 있습니다.`,
        path: lessonId,
        severity: "error",
      })
    }
  }

  return issues
}

function findDominantValue<T extends string | number>(
  values: readonly T[]
): { ratio: number; value: T } | null {
  if (values.length === 0) return null

  const counts = new Map<T, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  let dominantValue = values[0] as T
  let dominantCount = 0
  for (const [value, count] of counts) {
    if (count > dominantCount) {
      dominantValue = value
      dominantCount = count
    }
  }

  return {
    ratio: dominantCount / values.length,
    value: dominantValue,
  }
}
