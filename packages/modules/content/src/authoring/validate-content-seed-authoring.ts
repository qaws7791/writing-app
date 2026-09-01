import { validateAuthoringLessonSteps } from "#content/authoring/validate-authoring-lesson"
import type { AuthoringValidationIssue } from "#content/authoring/validate-authoring-lesson"

type SeedLesson = Readonly<{
  readonly id: string
  readonly steps: readonly unknown[]
}>

type SeedUnit = Readonly<{
  readonly lessons: readonly SeedLesson[]
}>

type SeedCourse = Readonly<{
  readonly id: string
  readonly units: readonly SeedUnit[]
}>

export function collectAuthoringIssuesFromSeedCourses(
  courses: readonly SeedCourse[],
  input?: {
    readonly courseIds?: readonly string[]
  }
): readonly AuthoringValidationIssue[] {
  const courseFilter =
    input?.courseIds === undefined ? null : new Set(input.courseIds)
  const issues: AuthoringValidationIssue[] = []

  for (const course of courses) {
    if (courseFilter !== null && !courseFilter.has(course.id)) continue

    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        if (lesson.steps.length === 0) continue

        issues.push(
          ...validateAuthoringLessonSteps({
            lessonId: lesson.id,
            steps: lesson.steps,
          })
        )
      }
    }
  }

  return issues
}
