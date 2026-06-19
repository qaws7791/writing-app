import type {
  CourseDetailDto,
  CourseSummaryDto,
  LessonSummaryDto,
} from "@workspace/core/modules/content/api"
import {
  lessonProgressStatuses,
  type LessonProgressStatus as PersistedLessonProgressStatus,
} from "@workspace/core/shared/kernel/status"
import type { LessonAvailabilityStatus } from "@workspace/core/modules/learning/domain/learner-read-model.dto"

export type LearnerProgressSnapshot = {
  readonly currentStreakDays: number
  readonly lessonProgress: readonly LearnerLessonProgressSnapshot[]
}

export type LearnerLessonProgressSnapshot = {
  readonly currentStepIndex: number
  readonly lessonId: string
  readonly status: PersistedLessonProgressStatus
}

export type ProgressReader = {
  readonly readLearnerProgress: (
    userId: string
  ) => Promise<LearnerProgressSnapshot>
}

export function toCourseProgress(
  course: CourseSummaryDto,
  courseDetail: CourseDetailDto,
  progressSnapshots: readonly LearnerLessonProgressSnapshot[]
) {
  const lessonProgress = resolveLessonProgress(courseDetail, progressSnapshots)
  const completedLessonCount = countCompletedLessons(lessonProgress)
  const progressPercent = toProgressPercent(
    completedLessonCount,
    lessonProgress.length
  )

  return {
    id: course.id,
    lessons: lessonProgress,
    nextLessons: lessonProgress
      .filter((lesson) => lesson.status === "available")
      .map((lesson) => ({
        courseId: course.id,
        currentStepIndex: lesson.currentStepIndex,
        estimatedMinutes: lesson.estimatedMinutes,
        id: lesson.id,
        status: lesson.status,
        title: lesson.title,
      })),
    progressPercent,
    title: course.title,
    visualKey: course.visualKey,
  }
}

export function withLearnerCourseProgress(
  courseDetail: CourseDetailDto,
  progressSnapshots: readonly LearnerLessonProgressSnapshot[]
): CourseDetailDto {
  const lessonProgress = resolveLessonProgress(courseDetail, progressSnapshots)
  const completedLessonCount = countCompletedLessons(lessonProgress)
  const nextLesson =
    lessonProgress.find((lesson) => lesson.status === "available") ?? null

  return {
    ...courseDetail,
    progress: {
      completedLessons: completedLessonCount,
      lessons: lessonProgress.map((lesson) => ({
        currentStepIndex: lesson.currentStepIndex,
        lessonId: lesson.id,
        status: lesson.status,
      })),
      nextLesson:
        nextLesson === null
          ? null
          : {
              currentStepIndex: nextLesson.currentStepIndex,
              estimatedMinutes: nextLesson.estimatedMinutes,
              id: nextLesson.id,
              status: nextLesson.status,
              title: nextLesson.title,
            },
      percentage: toProgressPercent(
        completedLessonCount,
        lessonProgress.length
      ),
      totalLessons: lessonProgress.length,
    },
  }
}

function resolveLessonProgress(
  courseDetail: CourseDetailDto,
  progressSnapshots: readonly LearnerLessonProgressSnapshot[]
) {
  const progressByLessonId = new Map(
    progressSnapshots.map((progress) => [progress.lessonId, progress])
  )
  const completedLessonIdSet = new Set(
    progressSnapshots
      .filter(
        (progress) => progress.status === lessonProgressStatuses.completed
      )
      .map((progress) => progress.lessonId)
  )
  const lessons = courseDetail.units.flatMap((unit) => unit.lessons)
  const firstIncompleteLesson = lessons.find(
    (lesson) => !completedLessonIdSet.has(lesson.id)
  )

  return lessons.map((lesson) =>
    toLessonProgress(
      lesson,
      progressByLessonId.get(lesson.id),
      completedLessonIdSet,
      firstIncompleteLesson?.id
    )
  )
}

function toLessonProgress(
  lesson: LessonSummaryDto,
  progress: LearnerLessonProgressSnapshot | undefined,
  completedLessonIds: ReadonlySet<string>,
  firstIncompleteLessonId: string | undefined
) {
  return {
    currentStepIndex: progress?.currentStepIndex ?? null,
    estimatedMinutes: lesson.estimatedMinutes,
    id: lesson.id,
    status: getLessonStatus(
      lesson.id,
      completedLessonIds,
      firstIncompleteLessonId
    ),
    title: lesson.title,
  }
}

function getLessonStatus(
  lessonId: string,
  completedLessonIds: ReadonlySet<string>,
  firstIncompleteLessonId: string | undefined
): LessonAvailabilityStatus {
  if (completedLessonIds.has(lessonId)) {
    return "completed"
  }

  if (lessonId === firstIncompleteLessonId) {
    return "available"
  }

  return "locked"
}

function countCompletedLessons(
  lessons: readonly { readonly status: LessonAvailabilityStatus }[]
): number {
  return lessons.filter((lesson) => lesson.status === "completed").length
}

function toProgressPercent(completedLessonCount: number, lessonCount: number) {
  return lessonCount === 0
    ? 0
    : Math.round((completedLessonCount / lessonCount) * 100)
}
