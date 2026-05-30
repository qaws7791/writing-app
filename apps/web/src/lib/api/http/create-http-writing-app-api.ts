import {
  mapCourseCategoriesDto,
  mapCourseDetailDto,
  mapCourseSearchDto,
  mergeCourseProgress,
} from "@/features/courses/course-api-mappers"
import { mapLessonDto } from "@/features/lessons/lesson-api-mappers"
import type { LessonId, LessonStepId } from "@/features/lessons/lesson-types"
import { apiErrorFromResponseBody, networkApiError } from "@/lib/api/api-error"
import { apiFailure, apiOk, type ApiResult } from "@/lib/api/api-result"
import type {
  AiFeedbackResult,
  CompleteLessonResult,
  CurrentUser,
  LessonProgress,
  ProfileSummary,
  WritingAppApi,
} from "@/lib/api/writing-app-api"
import {
  createOpenApiClient,
  type CreateOpenApiClientInput,
} from "@/lib/api/http/openapi-client"

export function createHttpWritingAppApi(
  input: CreateOpenApiClientInput
): WritingAppApi {
  const client = createOpenApiClient(input)

  return {
    async listCourseCategories() {
      return request(() => client.GET("/courses"), mapCourseCategoriesDto)
    },
    async searchCourses(query) {
      return request(
        () =>
          client.GET("/courses/search", {
            params: { query: { q: query } },
          } as never),
        mapCourseSearchDto
      )
    },
    async getCourseDetail(courseId) {
      const course = await request(
        () =>
          client.GET("/courses/{courseId}", {
            params: { path: { courseId } },
          }),
        mapCourseDetailDto
      )
      if (course.status === "error") {
        return course
      }

      const progress = await this.getCourseProgress(courseId)
      if (progress.status === "error") {
        return apiOk(course.value)
      }

      return apiOk(
        mergeCourseProgress(course.value, {
          completedCount: progress.value.completedLessons,
          totalLessons: progress.value.totalLessons,
          progressPercent: progress.value.percentage,
        })
      )
    },
    async getLesson(lessonId) {
      return request(
        () =>
          client.GET("/lessons/{lessonId}", {
            params: { path: { lessonId } },
          }),
        mapLessonDto
      )
    },
    async getCurrentUser() {
      return request(
        () => client.GET("/me"),
        (value) => value as CurrentUser
      )
    },
    async getProfile() {
      return request(
        () => client.GET("/profile"),
        (value) => value as ProfileSummary
      )
    },
    async listProgress() {
      return request(() => client.GET("/progress"), mapProgressCourseList)
    },
    async getCourseProgress(courseId) {
      return request(
        () =>
          client.GET("/courses/{courseId}/progress", {
            params: { path: { courseId } },
          }),
        (value) => ({
          completedLessons: value.completedCount,
          totalLessons: value.totalLessons,
          percentage: value.progressPercent,
        })
      )
    },
    async getLessonProgress(lessonId) {
      return request(
        () =>
          client.GET("/lessons/{lessonId}/progress", {
            params: { path: { lessonId } },
          }),
        mapLessonProgress
      )
    },
    async saveLessonProgress(lessonId, body) {
      return request(
        () =>
          client.PUT("/lessons/{lessonId}/progress", {
            params: { path: { lessonId } },
            body,
          } as never),
        mapLessonProgress
      )
    },
    async saveLessonAnswer(lessonId, body) {
      return request(
        () =>
          client.PUT("/lessons/{lessonId}/answers", {
            params: { path: { lessonId } },
            body,
          } as never),
        (value) => value
      )
    },
    async completeLesson(lessonId) {
      return request(
        () =>
          client.POST("/lessons/{lessonId}/complete", {
            params: { path: { lessonId } },
          }),
        mapCompleteLessonResult
      )
    },
    async createAiFeedback(body) {
      return request(
        () =>
          client.POST("/ai-feedback", {
            body,
          } as never),
        mapAiFeedbackResult
      )
    },
  }
}

function mapProgressCourseList(value: {
  courses: readonly {
    completedCount: number
    courseId: string
    nextLessonId?: string
    progressPercent: number
    totalLessons: number
  }[]
}) {
  return {
    courses: value.courses.map((course) => ({
      completedLessons: course.completedCount,
      courseId: course.courseId as never,
      nextLessonId: course.nextLessonId as never,
      percentage: course.progressPercent,
      totalLessons: course.totalLessons,
    })),
  }
}

async function request<TData, TValue>(
  run: () => Promise<{
    data?: TData
    error?: unknown
    response: Response
  }>,
  map: (data: TData) => TValue
): Promise<ApiResult<TValue>> {
  try {
    const { data, error, response } = await run()
    if (error || !response.ok) {
      return apiFailure(apiErrorFromResponseBody(response.status, error))
    }
    if (data === undefined) {
      return apiFailure({
        code: "contract-error",
        message: "서버 응답에 데이터가 없습니다.",
      })
    }

    return apiOk(map(data))
  } catch {
    return apiFailure(networkApiError())
  }
}

function mapLessonProgress(value: {
  answers: readonly {
    answer: string
    stepId: string
  }[]
  currentStepId: string
  lessonId: string
  status: "not-started" | "in-progress" | "completed"
  stepOrder: number
}): LessonProgress {
  return {
    answers: value.answers.map((answer) => ({
      answer: answer.answer,
      stepId: answer.stepId as LessonStepId,
    })),
    currentStepId: value.currentStepId as LessonStepId,
    lessonId: value.lessonId as LessonId,
    status: value.status,
    stepOrder: value.stepOrder,
  }
}

function mapCompleteLessonResult(value: {
  completedAt: string
  completedCount: number
  lessonId: string
  status: "completed"
  wasAlreadyCompleted: boolean
}): CompleteLessonResult {
  return {
    completedAt: value.completedAt,
    completedCount: value.completedCount,
    lessonId: value.lessonId as LessonId,
    status: value.status,
    wasAlreadyCompleted: value.wasAlreadyCompleted,
  }
}

function mapAiFeedbackResult(value: {
  improvements: readonly string[]
  nextAction: string
  score: number
  scoreRange: readonly number[]
  strengths: readonly string[]
  summary: string
}): AiFeedbackResult {
  return {
    improvements: value.improvements,
    nextAction: value.nextAction,
    score: value.score,
    scoreRange: [value.scoreRange[0] ?? 0, value.scoreRange[1] ?? 100],
    strengths: value.strengths,
    summary: value.summary,
  }
}
