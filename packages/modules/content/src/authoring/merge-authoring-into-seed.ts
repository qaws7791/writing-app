import { resolve } from "node:path"

import { collectAuthoringIssuesFromSeedCourses } from "#content/authoring/validate-content-seed-authoring"
import type { AuthoringValidationIssue } from "#content/authoring/validate-authoring-lesson"

type SeedLesson = {
  id: string
  steps: unknown[]
}

type SeedUnit = {
  lessons: SeedLesson[]
}

type SeedCourse = {
  id: string
  units: SeedUnit[]
}

export type MergeAuthoringIntoSeedResult = Readonly<{
  mergedLessonIds: readonly string[]
  mergedStepCount: number
  skippedLessonCount: number
}>

export async function mergeAuthoringIntoSeed(input: {
  readonly courseId: string
  readonly dryRun?: boolean
  readonly lessonsDirectory: string
  readonly seedPath: string
  readonly validateAuthoring?: boolean
}): Promise<
  | { readonly issues: readonly AuthoringValidationIssue[]; readonly ok: false }
  | { readonly ok: true; readonly result: MergeAuthoringIntoSeedResult }
> {
  const seedFile = Bun.file(input.seedPath)
  if (!(await seedFile.exists())) {
    return {
      issues: [
        {
          message: "시드 파일이 없습니다.",
          path: input.seedPath,
        },
      ],
      ok: false,
    }
  }

  const seed = (await seedFile.json()) as SeedCourse[]
  const course = seed.find((entry) => entry.id === input.courseId)
  if (course === undefined) {
    return {
      issues: [
        {
          message: `시드에서 코스를 찾을 수 없습니다: ${input.courseId}`,
          path: input.seedPath,
        },
      ],
      ok: false,
    }
  }

  const mergedLessonIds: string[] = []
  let mergedStepCount = 0
  let skippedLessonCount = 0

  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      const lessonPath = resolve(input.lessonsDirectory, `${lesson.id}.json`)
      const lessonFile = Bun.file(lessonPath)
      if (!(await lessonFile.exists())) {
        skippedLessonCount += 1
        continue
      }

      const steps = (await lessonFile.json()) as unknown[]
      if (!Array.isArray(steps)) {
        return {
          issues: [
            {
              message: "레슨 루트가 배열이 아닙니다.",
              path: lessonPath,
            },
          ],
          ok: false,
        }
      }

      lesson.steps = steps
      mergedLessonIds.push(lesson.id)
      mergedStepCount += steps.length
    }
  }

  if (input.validateAuthoring !== false) {
    const issues = collectAuthoringIssuesFromSeedCourses(seed, {
      courseIds: [input.courseId],
    })
    if (issues.length > 0) {
      return { issues, ok: false }
    }
  }

  if (input.dryRun !== true) {
    await Bun.write(input.seedPath, `${JSON.stringify(seed, null, 2)}\n`)
  }

  return {
    ok: true,
    result: {
      mergedLessonIds,
      mergedStepCount,
      skippedLessonCount,
    },
  }
}
