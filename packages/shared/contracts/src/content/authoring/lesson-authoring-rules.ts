import type { LessonStepDto } from "#contracts/content/course"
import { collectAnswerDistributionIssues } from "#contracts/content/authoring/answer-distribution"
import type { LessonAuthoringIssue } from "#contracts/content/authoring/authoring-issue"
import {
  authoringLimits,
  forbiddenLessonClosingStepTypes,
} from "#contracts/content/authoring/authoring-limits"
import { collectLessonQualityIssues } from "#contracts/content/authoring/lesson-quality-rules"

export type { LessonAuthoringIssue } from "#contracts/content/authoring/authoring-issue"

export function collectLessonAuthoringIssues(input: {
  readonly lessonId: string
  readonly steps: readonly LessonStepDto[]
}): readonly LessonAuthoringIssue[] {
  const issues: LessonAuthoringIssue[] = []
  const { lessonId, steps } = input

  if (
    steps.length < authoringLimits.lessonStepCount.min ||
    steps.length > authoringLimits.lessonStepCount.max
  ) {
    issues.push({
      message: `레슨 스텝은 ${authoringLimits.lessonStepCount.min}~${authoringLimits.lessonStepCount.max}개여야 합니다. 현재 ${steps.length}개입니다.`,
      path: lessonId,
      severity: "error",
    })
  }

  const readingIndices = steps.flatMap((step, index) =>
    step.type === "READING" ? [index] : []
  )
  if (readingIndices.length > authoringLimits.readingPerLesson) {
    issues.push({
      message: `READING은 레슨당 최대 ${authoringLimits.readingPerLesson}개입니다.`,
      path: lessonId,
      severity: "error",
    })
  }
  if (readingIndices.some((index) => index > 0)) {
    issues.push({
      message: "READING은 첫 스텝에만 올 수 있습니다.",
      path: lessonId,
      severity: "error",
    })
  }

  const lastStep = steps.at(-1)
  if (
    lastStep !== undefined &&
    (forbiddenLessonClosingStepTypes as readonly string[]).includes(
      lastStep.type
    )
  ) {
    issues.push({
      message: "마지막 스텝은 MULTIPLE_CHOICE일 수 없습니다.",
      path: lessonId,
      severity: "error",
    })
  }

  const typeCounts = new Map<string, number>()
  for (const step of steps) {
    typeCounts.set(step.type, (typeCounts.get(step.type) ?? 0) + 1)
  }
  for (const [type, count] of typeCounts) {
    if (count > authoringLimits.maxSameStepTypePerLesson) {
      issues.push({
        message: `${type}은(는) 레슨당 최대 ${authoringLimits.maxSameStepTypePerLesson}개입니다.`,
        path: lessonId,
        severity: "error",
      })
    }
  }

  issues.push(...collectAnswerDistributionIssues({ lessonId, steps }))
  issues.push(...collectLessonQualityIssues({ lessonId, steps }))

  return issues
}
