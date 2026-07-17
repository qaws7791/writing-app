import type {
  CourseLearningState,
  CurriculumVersionRef,
  LearnerCourseDetail,
  LearnerCourseSort,
  LearnerProgressCourse,
  LessonLearningState,
} from "@workspace/contracts/learning/read-data"
import {
  courseLearningStateSchema,
  curriculumVersionRefSchema,
  learnerCourseDetailSchema,
  learnerCourseSummarySchema,
  learnerProgressCourseSchema,
  lessonLearningStateSchema,
} from "@workspace/contracts/learning/read-data"

import {
  readLearnerCourseCursorPrimary,
  type LearnerCursorPosition,
} from "#core/modules/learning/application/learner-cursor"

export type LearnerCourseListProjectionRow = {
  readonly category: string
  readonly contentStatus: LearnerCourseDetail["contentStatus"]
  readonly description: string
  readonly id: string
  readonly lessonCount: number
  readonly revision: number
  readonly sortOrder: number
  readonly title: string
  readonly titleSortKey: string
  readonly versionId: string
  readonly visualKey: LearnerCourseDetail["visualKey"]
}

export type LearnerCourseProjectionLesson = {
  readonly category: string | null
  readonly contentStatus: LearnerCourseDetail["contentStatus"]
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly sortOrder: number
  readonly title: string
  readonly unitId: string
}

export type LearnerCourseProjectionStep = {
  readonly id: string
  readonly lessonId: string
  readonly sortOrder: number
}

export type LearnerCourseProgressProjectionRow = {
  readonly completedAt: Date | null
  readonly lastActivityAt: Date
  readonly status: "completed" | "in_progress"
}

export type LearnerLessonProgressProjectionRow = {
  readonly completedAt: Date | null
  readonly currentStepId: string
  readonly lessonId: string
  readonly status: "completed" | "in_progress"
  readonly updatedAt: Date
}

export type LearnerCourseProjectionBundle = {
  readonly course: {
    readonly contentStatus: LearnerCourseDetail["contentStatus"]
    readonly id: string
  }
  readonly courseProgress: LearnerCourseProgressProjectionRow | undefined
  readonly lessonProgress: readonly LearnerLessonProgressProjectionRow[]
  readonly lessons: readonly LearnerCourseProjectionLesson[]
  readonly steps: readonly LearnerCourseProjectionStep[]
  readonly units: readonly {
    readonly id: string
    readonly sortOrder: number
    readonly title: string
  }[]
  readonly version: {
    readonly category: string
    readonly description: string
    readonly id: string
    readonly revision: number
    readonly title: string
    readonly visualKey: LearnerCourseDetail["visualKey"]
  }
}

export type LearnerProgressPageProjectionRow = {
  readonly courseId: string
  readonly lastActivityAt: Date
}

export function projectLearnerCoursePage(input: {
  readonly limit: number
  readonly rows: readonly LearnerCourseListProjectionRow[]
  readonly sort: LearnerCourseSort
}) {
  const pageRows = input.rows.slice(0, input.limit)
  const items = pageRows.map((row) =>
    learnerCourseSummarySchema.parse({
      category: row.category,
      contentStatus: row.contentStatus,
      description: row.description,
      id: row.id,
      lessonCount: row.lessonCount,
      title: row.title,
      version: {
        curriculumVersionId: row.versionId,
        revision: row.revision,
      },
      visualKey: row.visualKey,
    })
  )
  const lastRow = input.rows.length > input.limit ? pageRows.at(-1) : undefined
  const nextPosition: LearnerCursorPosition | null =
    lastRow === undefined
      ? null
      : {
          courseId: lastRow.id,
          primary: readLearnerCourseCursorPrimary(lastRow, input.sort),
        }

  return { items, nextPosition }
}

export function projectLearnerProgressPageWindow(
  rows: readonly LearnerProgressPageProjectionRow[],
  limit: number
): {
  readonly nextPosition: LearnerCursorPosition | null
  readonly pageRows: readonly LearnerProgressPageProjectionRow[]
} {
  const pageRows = rows.slice(0, limit)
  const lastRow = rows.length > limit ? pageRows.at(-1) : undefined

  return {
    nextPosition:
      lastRow === undefined
        ? null
        : {
            courseId: lastRow.courseId,
            primary: lastRow.lastActivityAt.getTime(),
          },
    pageRows,
  }
}

export function projectLearnerProgressCourse(
  course: LearnerCourseDetail
): LearnerProgressCourse {
  return learnerProgressCourseSchema.parse({
    id: course.id,
    learning: course.learning,
    title: course.title,
    visualKey: course.visualKey,
  })
}

export function projectLearnerCourseDetail(
  bundle: LearnerCourseProjectionBundle
): LearnerCourseDetail {
  const version = curriculumVersionRefSchema.parse({
    curriculumVersionId: bundle.version.id,
    revision: bundle.version.revision,
  })
  const stepsByLessonId = groupStepsByLessonId(bundle.steps)
  const progressByLessonId = new Map(
    bundle.lessonProgress.map((progress) => [progress.lessonId, progress])
  )
  const firstIncompleteLesson = bundle.lessons.find(
    (lesson) => progressByLessonId.get(lesson.id)?.status !== "completed"
  )
  const lessonLearning = new Map<string, LessonLearningState>(
    bundle.lessons.map((lesson) => {
      const steps = stepsByLessonId.get(lesson.id) ?? []
      const progress = progressByLessonId.get(lesson.id)

      return [
        lesson.id,
        projectLearnerLessonLearningState({
          isFirstIncomplete: lesson.id === firstIncompleteLesson?.id,
          progress,
          steps,
          version,
        }),
      ]
    })
  )
  const learning = projectLearnerCourseLearningState({
    courseProgress: bundle.courseProgress,
    lessonLearning,
    lessons: bundle.lessons,
    stepsByLessonId,
    version,
  })

  return learnerCourseDetailSchema.parse({
    category: bundle.version.category,
    contentStatus: bundle.course.contentStatus,
    description: bundle.version.description,
    id: bundle.course.id,
    learning,
    lessonCount: bundle.lessons.length,
    title: bundle.version.title,
    units: bundle.units.map((unit) => ({
      id: unit.id,
      lessons: bundle.lessons
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson) => ({
          category: lesson.category,
          contentStatus: lesson.contentStatus,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          learning: lessonLearning.get(lesson.id),
          sortOrder: lesson.sortOrder,
          title: lesson.title,
        })),
      sortOrder: unit.sortOrder,
      title: unit.title,
    })),
    version,
    visualKey: bundle.version.visualKey,
  })
}

export function projectLearnerLessonLearningState(input: {
  readonly isFirstIncomplete: boolean
  readonly progress: LearnerLessonProgressProjectionRow | undefined
  readonly steps: readonly LearnerCourseProjectionStep[]
  readonly version: CurriculumVersionRef
}): LessonLearningState {
  if (input.progress?.status === "completed") {
    return lessonLearningStateSchema.parse({
      completion: {
        completedAt: toIso(
          input.progress.completedAt ?? input.progress.updatedAt
        ),
        totalSteps: input.steps.length,
      },
      status: "completed",
      version: input.version,
    })
  }

  if (!input.isFirstIncomplete) {
    return lessonLearningStateSchema.parse({
      status: "locked",
      version: input.version,
    })
  }

  if (input.progress === undefined) {
    return lessonLearningStateSchema.parse({
      status: "not_started",
      totalSteps: input.steps.length,
      version: input.version,
    })
  }

  const currentStepIndex = Math.max(
    0,
    input.steps.findIndex((step) => step.id === input.progress?.currentStepId)
  )

  return lessonLearningStateSchema.parse({
    completedSteps: currentStepIndex,
    currentStepId: input.progress.currentStepId,
    currentStepIndex,
    progressPercent:
      input.steps.length === 0
        ? 0
        : Math.round((currentStepIndex / input.steps.length) * 100),
    status: "in_progress",
    totalSteps: input.steps.length,
    version: input.version,
  })
}

export function projectLearnerCourseLearningState(input: {
  readonly courseProgress: LearnerCourseProgressProjectionRow | undefined
  readonly lessonLearning: ReadonlyMap<string, LessonLearningState>
  readonly lessons: readonly LearnerCourseProjectionLesson[]
  readonly stepsByLessonId: ReadonlyMap<
    string,
    readonly LearnerCourseProjectionStep[]
  >
  readonly version: CurriculumVersionRef
}): CourseLearningState {
  const completedLessons = input.lessons.filter(
    (lesson) => input.lessonLearning.get(lesson.id)?.status === "completed"
  ).length
  const totalLessons = input.lessons.length

  if (input.courseProgress?.status === "completed") {
    return courseLearningStateSchema.parse({
      completedAt: toIso(
        input.courseProgress.completedAt ?? input.courseProgress.lastActivityAt
      ),
      completedLessons,
      lastActivityAt: toIso(input.courseProgress.lastActivityAt),
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
      totalLessons,
      version: input.version,
    })
  }

  const nextLesson = input.lessons.find(
    (lesson) => input.lessonLearning.get(lesson.id)?.status !== "completed"
  )
  if (nextLesson === undefined) {
    throw new Error("In-progress curriculum must have a next lesson")
  }
  const nextLearning = input.lessonLearning.get(nextLesson.id)
  const steps = input.stepsByLessonId.get(nextLesson.id) ?? []
  const currentStepIndex =
    nextLearning?.status === "in_progress" ? nextLearning.currentStepIndex : 0
  const currentStepId =
    nextLearning?.status === "in_progress"
      ? nextLearning.currentStepId
      : steps[0]?.id
  if (currentStepId === undefined) {
    throw new Error("Published lesson must have at least one step")
  }
  const nextLessonReference = {
    currentStepId,
    currentStepIndex,
    estimatedMinutes: nextLesson.estimatedMinutes,
    id: nextLesson.id,
    title: nextLesson.title,
  }

  if (input.courseProgress === undefined) {
    return courseLearningStateSchema.parse({
      completedLessons: 0,
      nextLesson: nextLessonReference,
      progressPercent: 0,
      status: "not_started",
      totalLessons,
      version: input.version,
    })
  }

  return courseLearningStateSchema.parse({
    completedLessons,
    lastActivityAt: toIso(input.courseProgress.lastActivityAt),
    nextLesson: nextLessonReference,
    progressPercent:
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100),
    status: "in_progress",
    totalLessons,
    version: input.version,
  })
}

function groupStepsByLessonId(
  steps: readonly LearnerCourseProjectionStep[]
): ReadonlyMap<string, readonly LearnerCourseProjectionStep[]> {
  const stepsByLessonId = new Map<
    string,
    readonly LearnerCourseProjectionStep[]
  >()

  for (const step of steps) {
    const lessonSteps = stepsByLessonId.get(step.lessonId) ?? []
    stepsByLessonId.set(step.lessonId, [...lessonSteps, step])
  }

  return stepsByLessonId
}

function toIso(value: Date): string {
  return value.toISOString()
}
