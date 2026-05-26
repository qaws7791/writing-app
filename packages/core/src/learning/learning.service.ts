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
} from "@/content"
import { lessonId } from "@/content"
import type {
  CompleteLessonDto,
  CourseProgressDto,
  LessonProgressDto,
  ProfileDto,
  ProgressCourseListDto,
  SaveLessonAnswerRequestDto,
  SaveLessonProgressRequestDto,
} from "@/learning/learning.dto"
import type { LearningDatabaseUnavailableErrorDto } from "@/learning/learning.errors"
import type { UserId } from "@/learning/learning.ids"
import type { LearningRepository } from "@/learning/learning.repository"

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
  error: CourseNotFoundErrorDto | LessonNotFoundErrorDto
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
  getProfile(userId: UserId): Promise<LearningServiceResult<ProfileDto>>
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
    message: "Database is unavailable.",
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
    async getProfile(userId) {
      try {
        const courses = await repository.listInProgressCourses(userId)

        return {
          status: "ok",
          value: {
            completedLessonCount: courses.reduce(
              (sum, course) => sum + course.completedCount,
              0
            ),
            courseCount: courses.length,
          },
        }
      } catch {
        return unavailableResult
      }
    },

    async listProgress(userId) {
      let courses
      try {
        courses = await repository.listInProgressCourses(userId)
      } catch {
        return unavailableResult
      }

      const progressResults = await Promise.all(
        courses.map((course) =>
          service.getCourseProgress(userId, course.courseId)
        )
      )
      const unavailable = progressResults.find(
        (result) => result.status !== "ok"
      )
      if (unavailable) {
        return unavailableResult
      }

      return {
        status: "ok",
        value: {
          courses: progressResults.map((result) => {
            if (result.status !== "ok") {
              throw new Error("Progress result must be ok.")
            }

            return result.value
          }),
        },
      }
    },

    async getCourseProgress(userId, courseId) {
      const courseResult = await contentService.getCourseDetail(courseId)
      if (courseResult.status !== "ok") {
        return contentFailureResult(courseResult)
      }

      const lessons = courseResult.value.chapters.flatMap(
        (chapter) => chapter.lessons
      )
      let lessonProgress
      try {
        lessonProgress = await repository.listLessonProgressByCourse(
          userId,
          courseId
        )
      } catch {
        return unavailableResult
      }

      const completedLessonIds = new Set(
        lessonProgress
          .filter((progress) => progress.status === "completed")
          .map((progress) => progress.lessonId)
      )
      const completedCount = completedLessonIds.size
      const nextLesson = lessons.find(
        (courseLesson) =>
          !completedLessonIds.has(lessonId(courseLesson.lessonId))
      )

      return {
        status: "ok",
        value: {
          completedCount,
          courseId,
          nextLessonId: nextLesson?.lessonId,
          progressPercent: getProgressPercent(completedCount, lessons.length),
          totalLessons: lessons.length,
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
        return invalidRequest("Lesson step was not found.")
      }

      try {
        await repository.upsertCourseProgress({
          courseId: lessonResult.value.courseId as CourseId,
          lastLessonId: lessonId,
          userId,
        })
        const progress = await repository.upsertLessonProgress({
          courseId: lessonResult.value.courseId as CourseId,
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
        return invalidRequest("Lesson step was not found.")
      }

      if (!answerStepTypes.has(targetStep.type)) {
        return invalidRequest("This lesson step does not accept saved answers.")
      }

      try {
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
        const completed = await repository.completeLesson({
          courseId: lessonResult.value.courseId as CourseId,
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
