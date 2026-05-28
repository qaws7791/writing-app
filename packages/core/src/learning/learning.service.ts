import type {
  ContentService,
  CourseId,
  CourseNotFoundErrorDto,
  CurriculumVersionId,
  InvalidContentSeedErrorDto,
  InvalidRequestErrorDto,
  LessonDto,
  LessonId,
  LessonNotFoundErrorDto,
  LessonStepDto,
} from "@/content"
import type {
  CompleteLessonDto,
  CourseProgressDto,
  CurriculumUpgradeApplicationDto,
  CurriculumUpgradeNoticeDto,
  DismissCurriculumUpgradeDto,
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
  getProfile(userId: UserId): Promise<LearningServiceResult<ProfileDto>>
  listProgress(
    userId: UserId
  ): Promise<LearningServiceResult<ProgressCourseListDto>>
  getCourseProgress(
    userId: UserId,
    courseId: CourseId
  ): Promise<LearningServiceResult<CourseProgressDto>>
  getCurriculumUpgrade(
    userId: UserId,
    courseId: CourseId
  ): Promise<LearningServiceResult<CurriculumUpgradeNoticeDto>>
  applyCurriculumUpgrade(
    userId: UserId,
    courseId: CourseId
  ): Promise<LearningServiceResult<CurriculumUpgradeApplicationDto>>
  dismissCurriculumUpgrade(
    userId: UserId,
    courseId: CourseId
  ): Promise<LearningServiceResult<DismissCurriculumUpgradeDto>>
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

      let curriculumVersionId: CurriculumVersionId | undefined
      let lessonIds: LessonId[]
      let lessonProgress
      try {
        curriculumVersionId = await resolveCurriculumVersionId(
          repository,
          userId,
          courseId
        )
        if (!curriculumVersionId) {
          return invalidRequest("Published curriculum version was not found.")
        }

        ;[lessonIds, lessonProgress] = await Promise.all([
          repository.listCurriculumVersionLessonIds(curriculumVersionId),
          repository.listLessonProgressByCourse(
            userId,
            courseId,
            curriculumVersionId
          ),
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

    async getCurriculumUpgrade(userId, courseId) {
      const courseResult = await contentService.getCourseDetail(courseId)
      if (courseResult.status !== "ok") {
        return contentFailureResult(courseResult)
      }

      try {
        const upgrade = await repository.findCurriculumUpgrade(userId, courseId)

        if (!upgrade) {
          return {
            status: "ok",
            value: {
              courseId,
              status: "not-available",
            },
          }
        }

        return {
          status: "ok",
          value: {
            completedCount: upgrade.completedCount,
            courseId: upgrade.courseId,
            fromVersion: {
              id: upgrade.fromVersion.id,
              title: upgrade.fromVersion.title,
              versionNumber: upgrade.fromVersion.versionNumber,
            },
            message: createCurriculumUpgradeMessage(
              upgrade.toVersion.changelog
            ),
            migrationId: upgrade.migrationId,
            status: "available",
            toVersion: {
              changelog: upgrade.toVersion.changelog,
              id: upgrade.toVersion.id,
              title: upgrade.toVersion.title,
              versionNumber: upgrade.toVersion.versionNumber,
            },
            totalLessons: upgrade.totalLessons,
          },
        }
      } catch {
        return unavailableResult
      }
    },

    async applyCurriculumUpgrade(userId, courseId) {
      const courseResult = await contentService.getCourseDetail(courseId)
      if (courseResult.status !== "ok") {
        return contentFailureResult(courseResult)
      }

      try {
        const result = await repository.applyCurriculumUpgrade(userId, courseId)

        switch (result.status) {
          case "applied":
            return {
              status: "ok",
              value: mapCurriculumUpgradeApplication(result.application),
            }
          case "invalid-request":
            return {
              status: "invalid-request",
              error: result.error,
            }
          case "not-found":
            return {
              status: "not-found",
              error: result.error,
            }
        }
      } catch {
        return unavailableResult
      }
    },

    async dismissCurriculumUpgrade(userId, courseId) {
      const courseResult = await contentService.getCourseDetail(courseId)
      if (courseResult.status !== "ok") {
        return contentFailureResult(courseResult)
      }

      try {
        const result = await repository.dismissCurriculumUpgrade(
          userId,
          courseId
        )

        switch (result.status) {
          case "dismissed":
            return {
              status: "ok",
              value: {
                courseId: result.dismissal.courseId,
                dismissedAt: result.dismissal.dismissedAt.toISOString(),
                fromVersionId: result.dismissal.fromVersionId,
                status: "dismissed",
                toVersionId: result.dismissal.toVersionId,
              },
            }
          case "not-found":
            return {
              status: "not-found",
              error: result.error,
            }
        }
      } catch {
        return unavailableResult
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
        const curriculumVersionId = await resolveCurriculumVersionId(
          repository,
          userId,
          lessonResult.value.courseId as CourseId
        )
        if (!curriculumVersionId) {
          return invalidRequest("Published curriculum version was not found.")
        }

        const isVersionLesson =
          await repository.curriculumVersionIncludesLesson(
            curriculumVersionId,
            lessonId
          )
        if (!isVersionLesson) {
          return invalidRequest(
            "Lesson is not part of the learner curriculum version."
          )
        }

        await repository.upsertCourseProgress({
          courseId: lessonResult.value.courseId as CourseId,
          curriculumVersionId,
          lastLessonId: lessonId,
          userId,
        })
        const progress = await repository.upsertLessonProgress({
          courseId: lessonResult.value.courseId as CourseId,
          curriculumVersionId,
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
        const curriculumVersionId = await resolveCurriculumVersionId(
          repository,
          userId,
          lessonResult.value.courseId as CourseId
        )
        if (!curriculumVersionId) {
          return invalidRequest("Published curriculum version was not found.")
        }

        const isVersionLesson =
          await repository.curriculumVersionIncludesLesson(
            curriculumVersionId,
            lessonId
          )
        if (!isVersionLesson) {
          return invalidRequest(
            "Lesson is not part of the learner curriculum version."
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
        const curriculumVersionId = await resolveCurriculumVersionId(
          repository,
          userId,
          lessonResult.value.courseId as CourseId
        )
        if (!curriculumVersionId) {
          return invalidRequest("Published curriculum version was not found.")
        }

        const isVersionLesson =
          await repository.curriculumVersionIncludesLesson(
            curriculumVersionId,
            lessonId
          )
        if (!isVersionLesson) {
          return invalidRequest(
            "Lesson is not part of the learner curriculum version."
          )
        }

        const completed = await repository.completeLesson({
          courseId: lessonResult.value.courseId as CourseId,
          curriculumVersionId,
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

async function resolveCurriculumVersionId(
  repository: LearningRepository,
  userId: UserId,
  courseId: CourseId
): Promise<CurriculumVersionId | undefined> {
  const existingProgress = await repository.findCourseProgress(userId, courseId)

  if (existingProgress) {
    return existingProgress.curriculumVersionId
  }

  return repository.findLatestPublishedCurriculumVersionId(courseId)
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

function createCurriculumUpgradeMessage(changelog: string) {
  return `새 커리큘럼에는 ${changelog}`
}

function mapCurriculumUpgradeApplication(application: {
  completedLessonCount: number
  completedLessonIds: LessonId[]
  courseId: CourseId
  createdAt: Date
  fromVersionId: CurriculumVersionId
  id: string
  migrationId: string
  preservedLessonIds: LessonId[]
  skippedLessonIds: LessonId[]
  status: "completed"
  toVersionId: CurriculumVersionId
  updatedAt: Date
}): CurriculumUpgradeApplicationDto {
  return {
    completedLessonCount: application.completedLessonCount,
    completedLessonIds: application.completedLessonIds,
    courseId: application.courseId,
    createdAt: application.createdAt.toISOString(),
    fromVersionId: application.fromVersionId,
    id: application.id,
    migrationId: application.migrationId,
    preservedLessonIds: application.preservedLessonIds,
    skippedLessonIds: application.skippedLessonIds,
    status: application.status,
    toVersionId: application.toVersionId,
    updatedAt: application.updatedAt.toISOString(),
  }
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
