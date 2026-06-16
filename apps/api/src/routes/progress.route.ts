import { Hono } from "hono"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"
import type {
  ContentRepository,
  CourseDetailDto,
  CourseSummaryDto,
  LessonSummaryDto,
} from "@workspace/core/content"
import {
  type LessonProgressStatus as PersistedLessonProgressStatus,
  lessonProgressStatuses,
} from "@workspace/core/status"

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

export type LessonAvailabilityStatus = "available" | "completed" | "locked"

export type ProgressRouteDependencies = {
  readonly contentRepository: ContentRepository
  readonly progressReader: ProgressReader
  readonly sessionResolver: SessionResolver
}

export function createProgressRoute({
  contentRepository,
  progressReader,
  sessionResolver,
}: ProgressRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const [courses, progress] = await Promise.all([
      contentRepository.listCourses(),
      progressReader.readLearnerProgress(sessionResult.session.user.id),
    ])
    const courseProgress = await Promise.all(
      courses.map(async (course) => {
        const courseDetail = await contentRepository.findCourseDetail(course.id)

        if (courseDetail === null) {
          return null
        }

        return toCourseProgress(course, courseDetail, progress.lessonProgress)
      })
    )

    return context.json({
      courses: courseProgress.filter((course) => course !== null),
      user: {
        currentStreakDays: progress.currentStreakDays,
      },
    })
  })

  return route
}

function toCourseProgress(
  course: CourseSummaryDto,
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
  const lessonProgress = lessons.map((lesson) =>
    toLessonProgress(
      lesson,
      progressByLessonId.get(lesson.id),
      completedLessonIdSet,
      firstIncompleteLesson?.id
    )
  )
  const completedLessonCount = lessonProgress.filter(
    (lesson) => lesson.status === "completed"
  ).length
  const progressPercent =
    lessonProgress.length === 0
      ? 0
      : Math.round((completedLessonCount / lessonProgress.length) * 100)

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
  }
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
