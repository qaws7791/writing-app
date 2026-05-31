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
import type {
  InvalidContentResult,
  InvalidRequestResult,
  NotFoundResult,
  OkResult,
  UnavailableResult,
} from "../result"

type LearningInvalidRequestError = {
  code: "invalid-request"
  message: string
}

type LearningNotFoundError =
  | CourseNotFoundErrorDto
  | LessonNotFoundErrorDto
  | {
      code: "not-found"
      message: string
    }

type LearningServiceResult<TValue> =
  | OkResult<TValue>
  | InvalidRequestResult<LearningInvalidRequestError>
  | NotFoundResult<LearningNotFoundError>
  | InvalidContentResult<InvalidContentSeedErrorDto>
  | UnavailableResult<LearningDatabaseUnavailableErrorDto>

type ContentFailureResult =
  | NotFoundResult<CourseNotFoundErrorDto | LessonNotFoundErrorDto>
  | InvalidContentResult<InvalidContentSeedErrorDto>
  | InvalidRequestResult<InvalidRequestErrorDto>
  | UnavailableResult<LearningDatabaseUnavailableErrorDto>

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

const unavailableResult: UnavailableResult<LearningDatabaseUnavailableErrorDto> =
  {
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
  const lessons: ProgressCourseDto["lessons"] = []
  let completedCount = 0
  let nextLessonId: LessonId | undefined

  for (const lesson of summary.lessons) {
    if (lesson.progressStatus === "completed") {
      completedCount += 1
      lessons.push({
        lessonId: lesson.lessonId,
        status: "completed",
        title: lesson.title,
      })
      continue
    }

    const isNextLesson = !nextLessonId
    nextLessonId ??= lesson.lessonId
    lessons.push({
      lessonId: lesson.lessonId,
      status: isNextLesson ? "next-up" : "locked",
      title: lesson.title,
    })
  }

  return {
    completedCount,
    courseDescription: summary.courseDescription,
    courseId: summary.courseId,
    courseTitle: summary.courseTitle,
    lessons,
    nextLessonId,
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

function invalidRequest(
  message: string
): InvalidRequestResult<LearningInvalidRequestError> {
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
  | InvalidRequestResult<InvalidRequestErrorDto>
  | NotFoundResult<CourseNotFoundErrorDto | LessonNotFoundErrorDto>
  | InvalidContentResult<InvalidContentSeedErrorDto>
  | UnavailableResult<LearningDatabaseUnavailableErrorDto> {
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
