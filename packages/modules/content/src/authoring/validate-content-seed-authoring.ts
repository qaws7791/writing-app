import { collectUnitAuthoringIssues } from "@workspace/contracts/content/authoring"

import { validateAuthoringLessonSteps } from "#content/authoring/validate-authoring-lesson"
import type { AuthoringValidationIssue } from "#content/authoring/validate-authoring-lesson"

type SeedLesson = Readonly<{
  readonly id: string
  readonly steps: readonly unknown[]
}>

type SeedUnit = Readonly<{
  readonly id: string
  readonly lessons: readonly SeedLesson[]
}>

type SeedCourse = Readonly<{
  readonly id: string
  readonly units: readonly SeedUnit[]
}>

/**
 * `lessonIds`를 주면 그 레슨과, 그 레슨이 속한 유닛만 검사한다.
 * 코스를 유닛 단위로 교체하는 동안 아직 재집필하지 않은 레슨이 병합을 막지 않게 한다.
 */
export function collectAuthoringIssuesFromSeedCourses(
  courses: readonly SeedCourse[],
  input?: {
    readonly courseIds?: readonly string[]
    readonly lessonIds?: readonly string[]
  }
): readonly AuthoringValidationIssue[] {
  const courseFilter =
    input?.courseIds === undefined ? null : new Set(input.courseIds)
  const lessonFilter =
    input?.lessonIds === undefined ? null : new Set(input.lessonIds)
  const issues: AuthoringValidationIssue[] = []

  for (const course of courses) {
    if (courseFilter !== null && !courseFilter.has(course.id)) continue

    for (const unit of course.units) {
      const targetLessons = unit.lessons.filter(
        (lesson) => lessonFilter === null || lessonFilter.has(lesson.id)
      )
      if (targetLessons.length === 0) continue

      for (const lesson of targetLessons) {
        if (lesson.steps.length === 0) continue

        issues.push(
          ...validateAuthoringLessonSteps({
            lessonId: lesson.id,
            steps: lesson.steps,
          })
        )
      }

      issues.push(
        ...collectUnitAuthoringIssues({
          lessons: unit.lessons.map((lesson) => ({
            lessonId: lesson.id,
            stepTypes: lesson.steps.map((step) =>
              isRecord(step) ? String(step["type"]) : "<유형 없음>"
            ),
          })),
          unitId: unit.id,
        })
      )
    }
  }

  return issues
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
