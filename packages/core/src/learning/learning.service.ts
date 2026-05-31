import type {
  ContentService,
  CourseId,
  CourseNotFoundErrorDto,
  InvalidContentSeedErrorDto,
  InvalidRequestErrorDto,
  LessonDto,
  LessonId,
  LessonNotFoundErrorDto,
  LessonStepDto,
} from "../content"
import type {
  CompleteLessonDto,
  CourseProgressDto,
  LessonProgressDto,
  ProgressCourseDto,
  ProgressCourseListDto,
  SaveLessonAnswerRequestDto,
  SaveLessonProgressRequestDto,
} from "./learning.dto"
import type { LearningDatabaseUnavailableErrorDto } from "./learning.errors"
import type { UserId } from "./learning.ids"
import type {
  LearningRepository,
  ProgressCourseSummaryRecord,
} from "./learning.repository"

type OkResult<TValue> = {
  status: "ok"
  value: TValue
}

type InvalidRequestResult = {
  status: "invalid-request"
  error: {
    code: "invalid-request"
    message: string
  }
}

type UnavailableResult = {
  status: "unavailable"
  error: LearningDatabaseUnavailableErrorDto
}

type NotFoundResult = {
  status: "not-found"
  error:
    | CourseNotFoundErrorDto
    | LessonNotFoundErrorDto
    | {
        code: "not-found"
        message: string
      }
}

type InvalidContentResult = {
  status: "invalid-content"
  error: InvalidContentSeedErrorDto
}

type LearningServiceResult<TValue> =
  | OkResult<TValue>
  | InvalidRequestResult
  | NotFoundResult
  | InvalidContentResult
  | UnavailableResult

type ContentFailureResult =
  | {
      status: "not-found"
      error: CourseNotFoundErrorDto | LessonNotFoundErrorDto
    }
  | {
      status: "invalid-content"
      error: InvalidContentSeedErrorDto
    }
  | {
      status: "invalid-request"
      error: InvalidRequestErrorDto
    }
  | {
      status: "unavailable"
      error: LearningDatabaseUnavailableErrorDto
    }

export interface LearningService {
  listProgress(
    userId: UserId
  ): Promise<LearningServiceResult<ProgressCourseListDto>>
  getCourseProgress(
    userId: UserId,
    courseId: CourseId
  ): Promise<LearningServiceResult<CourseProgressDto>>
  getLessonProgress(
    userId: UserId,
    lessonId: LessonId
  ): Promise<LearningServiceResult<LessonProgressDto>>
  saveLessonProgress(
    userId: UserId,
    lessonId: LessonId,
    request: SaveLessonProgressRequestDto
  ): Promise<LearningServiceResult<LessonProgressDto>>
  saveLessonAnswer(
    userId: UserId,
    lessonId: LessonId,
    request: SaveLessonAnswerRequestDto
  ): Promise<LearningServiceResult<{ saved: true }>>
  completeLesson(
    userId: UserId,
    lessonId: LessonId
  ): Promise<LearningServiceResult<CompleteLessonDto>>
}

interface LearningServiceDependencies {
  contentService: ContentService
  repository: LearningRepository
}

const unavailableResult: UnavailableResult = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "데이터베이스를 사용할 수 없습니다.",
  },
}

const answerStepTypes = new Set([
  "SHORT_WRITE",
  "LONG_WRITE",
  "REVISION",
  "CHECKLIST",
  "REFLECTION",
])

export function createLearningService({
  contentService,
  repository,
}: LearningServiceDependencies): LearningService {
  const service: LearningService = {
    async listProgress(userId) {
      let courses
      try {
        courses = await repository.listProgressSummaries(userId)
      } catch {
        return unavailableResult
      }

      return {
        status: "ok",
        value: {
          courses: courses.map(mapProgressCourseSummary),
        },
      }
    },

    async getCourseProgress(userId, courseId) {
      const courseResult = await contentService.getCourseDetail(courseId)
      if (courseResult.status !== "ok") {
        return contentFailureResult(courseResult)
      }

      let lessonIds: LessonId[]
      let lessonProgress
      try {
        ;[lessonIds, lessonProgress] = await Promise.all([
          repository.listCourseLessonIds(courseId),
          repository.listLessonProgressByCourse(userId, courseId),
        ])
      } catch {
        return unavailableResult
      }

      const completedLessonIds = new Set(
        lessonProgress
          .filter((progress) => progress.status === "completed")
          .map((progress) => progress.lessonId)
      )
      const completedCount = completedLessonIds.size
      const nextLessonId = lessonIds.find(
        (lessonId) => !completedLessonIds.has(lessonId)
      )

      return {
        status: "ok",
        value: {
          completedCount,
          courseId,
          nextLessonId,
          progressPercent: getProgressPercent(completedCount, lessonIds.length),
          totalLessons: lessonIds.length,
        },
      }
    },

    async getLessonProgress(userId, lessonId) {
      const lessonResult = await contentService.getLesson(lessonId)
      if (lessonResult.status !== "ok") {
        return contentFailureResult(lessonResult)
      }

      try {
        const [progress, answers] = await Promise.all([
          repository.findLessonProgress(userId, lessonId),
          repository.listLessonAnswers(userId, lessonId),
        ])

        if (!progress) {
          const firstStep = lessonResult.value.steps[0]

          return {
            status: "ok",
            value: {
              answers: [],
              currentStepId: firstStep?.id ?? "",
              lessonId,
              status: "not-started",
              stepOrder: firstStep?.order ?? 1,
            },
          }
        }

        return {
          status: "ok",
          value: {
            answers: answers.map(({ answer, stepId }) => ({
              answer,
              stepId,
            })),
            currentStepId: progress.currentStepId,
            lessonId,
            status: progress.status,
            stepOrder: progress.stepOrder,
          },
        }
      } catch {
        return unavailableResult
      }
    },

    async saveLessonProgress(userId, lessonId, request) {
      const lessonResult = await contentService.getLesson(lessonId)
      if (lessonResult.status !== "ok") {
        return contentFailureResult(lessonResult)
      }

      const targetStep = findStep(lessonResult.value, request.currentStepId)
      if (!targetStep || targetStep.order !== request.stepOrder) {
        return invalidRequest("레슨 스텝을 찾을 수 없습니다.")
      }

      try {
        const courseId = lessonResult.value.courseId as CourseId
        const isCourseLesson = await repository.courseIncludesLesson(
          courseId,
          lessonId
        )
        if (!isCourseLesson) {
          return invalidRequest(
            "레슨이 현재 코스 커리큘럼에 포함되어 있지 않습니다."
          )
        }

        await repository.upsertCourseProgress({
          courseId,
          lastLessonId: lessonId,
          userId,
        })
        const progress = await repository.upsertLessonProgress({
          courseId,
          currentStepId: targetStep.id,
          lessonId,
          status: "in-progress",
          stepOrder: targetStep.order,
          userId,
        })

        return {
          status: "ok",
          value: {
            answers: [],
            currentStepId: progress.currentStepId,
            lessonId,
            status: progress.status,
            stepOrder: progress.stepOrder,
          },
        }
      } catch {
        return unavailableResult
      }
    },

    async saveLessonAnswer(userId, lessonId, request) {
      const lessonResult = await contentService.getLesson(lessonId)
      if (lessonResult.status !== "ok") {
        return contentFailureResult(lessonResult)
      }

      const targetStep = findStep(lessonResult.value, request.stepId)
      if (!targetStep) {
        return invalidRequest("레슨 스텝을 찾을 수 없습니다.")
      }

      if (!answerStepTypes.has(targetStep.type)) {
        return invalidRequest("이 레슨 스텝은 답변 저장을 지원하지 않습니다.")
      }

      try {
        const isCourseLesson = await repository.courseIncludesLesson(
          lessonResult.value.courseId as CourseId,
          lessonId
        )
        if (!isCourseLesson) {
          return invalidRequest(
            "레슨이 현재 코스 커리큘럼에 포함되어 있지 않습니다."
          )
        }

        await repository.upsertLessonAnswer({
          answer: request.answer,
          lessonId,
          stepId: targetStep.id,
          userId,
        })

        return {
          status: "ok",
          value: { saved: true },
        }
      } catch {
        return unavailableResult
      }
    },

    async completeLesson(userId, lessonId) {
      const lessonResult = await contentService.getLesson(lessonId)
      if (lessonResult.status !== "ok") {
        return contentFailureResult(lessonResult)
      }

      const finalStep = getFinalStep(lessonResult.value)

      try {
        const courseId = lessonResult.value.courseId as CourseId
        const isCourseLesson = await repository.courseIncludesLesson(
          courseId,
          lessonId
        )
        if (!isCourseLesson) {
          return invalidRequest(
            "레슨이 현재 코스 커리큘럼에 포함되어 있지 않습니다."
          )
        }

        const completed = await repository.completeLesson({
          courseId,
          finalStepId: finalStep.id,
          lessonId,
          stepOrder: finalStep.order,
          userId,
        })

        return {
          status: "ok",
          value: {
            completedAt: completed.completedAt.toISOString(),
            completedCount: completed.completedCount,
            lessonId,
            status: "completed",
            wasAlreadyCompleted: completed.wasAlreadyCompleted,
          },
        }
      } catch {
        return unavailableResult
      }
    },
  }

  return service
}

function mapProgressCourseSummary(
  summary: ProgressCourseSummaryRecord
): ProgressCourseDto {
  const lessons: ProgressCourseDto["lessons"] = summary.lessons.map(
    (lesson) => ({
      lessonId: lesson.lessonId,
      status: lesson.progressStatus === "completed" ? "completed" : "locked",
      title: lesson.title,
    })
  )
  const completedCount = lessons.filter(
    (lesson) => lesson.status === "completed"
  ).length
  const nextLesson = lessons.find((lesson) => lesson.status !== "completed")

  if (nextLesson) {
    nextLesson.status = "next-up"
  }

  return {
    completedCount,
    courseDescription: summary.courseDescription,
    courseId: summary.courseId,
    courseTitle: summary.courseTitle,
    lessons,
    nextLessonId: nextLesson?.lessonId,
    progressPercent: getProgressPercent(completedCount, lessons.length),
    totalLessons: lessons.length,
  }
}

function findStep(lesson: LessonDto, stepId: string) {
  return lesson.steps.find((step) => step.id === stepId)
}

function getFinalStep(lesson: LessonDto): LessonStepDto {
  const finalStep = lesson.steps.at(-1)

  if (!finalStep) {
    throw new Error(`Lesson must include at least one step: ${lesson.id}`)
  }

  return finalStep
}

function getProgressPercent(completedCount: number, totalLessons: number) {
  if (totalLessons === 0) {
    return 0
  }

  return Math.round((completedCount / totalLessons) * 100)
}

function invalidRequest(message: string): InvalidRequestResult {
  return {
    status: "invalid-request",
    error: {
      code: "invalid-request",
      message,
    },
  }
}

function contentFailureResult(
  result: ContentFailureResult
):
  | InvalidRequestResult
  | NotFoundResult
  | InvalidContentResult
  | UnavailableResult {
  switch (result.status) {
    case "invalid-request":
      return result
    case "not-found":
      return result
    case "invalid-content":
      return result
    case "unavailable":
      return unavailableResult
  }
}
