import {
  learnerAiFeedbackTransitionResponseSchema,
  learnerCompleteStepResponseSchema,
  learnerCourseCategoriesResponseSchema,
  learnerCourseDetailResponseSchema,
  learnerCourseListResponseSchema,
  learnerLessonResponseSchema,
  learnerProfileResponseSchema,
  learnerProgressResponseSchema,
  learnerStartLessonResponseSchema,
  type LearnerAiFeedbackTransitionResult,
  type LearnerCourseCategoriesResponse,
  type LearnerCourseDetailResponse,
  type LearnerCourseListResponse,
  type LearnerLessonResponse,
  type LearnerProfileResponse,
  type LearnerProgressResponse,
} from "@workspace/contracts/learning"

import {
  createOpenApiClient,
  type FetchLike,
  type TokenProvider,
} from "@/lib/api/http/openapi-client"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"
import type { BrowserApiBaseUrl } from "@/runtime-config"
import type { ServerApiBaseUrl } from "@/runtime-config-server"

export function createHttpWritingAppApi({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: BrowserApiBaseUrl | ServerApiBaseUrl
  readonly fetch: FetchLike
  readonly tokenProvider: TokenProvider
}): WritingAppApi {
  const client = createOpenApiClient({ baseUrl, fetch, tokenProvider })

  return {
    async completeStep(input) {
      return client.requestJson({
        body: input.request,
        method: "POST",
        path: `/learning/lessons/${input.lessonId}/steps/${input.stepId}/complete`,
        schema: learnerCompleteStepResponseSchema,
      })
    },
    async getCourseCategories() {
      return client.requestJson<LearnerCourseCategoriesResponse>({
        method: "GET",
        path: "/course-categories",
        schema: learnerCourseCategoriesResponseSchema,
      })
    },
    async getCourseDetail(courseId) {
      return client.requestJson<LearnerCourseDetailResponse>({
        method: "GET",
        path: `/courses/${courseId}`,
        schema: learnerCourseDetailResponseSchema,
      })
    },
    async getLesson(lessonId) {
      return client.requestJson<LearnerLessonResponse>({
        method: "GET",
        path: `/lessons/${lessonId}`,
        schema: learnerLessonResponseSchema,
      })
    },
    async getProfile() {
      return client.requestJson<LearnerProfileResponse>({
        method: "GET",
        path: "/profile",
        schema: learnerProfileResponseSchema,
      })
    },
    async getProgress(options) {
      return client.requestJson<LearnerProgressResponse>({
        method: "GET",
        path: buildProgressPath(options),
        schema: learnerProgressResponseSchema,
      })
    },
    async listCourses(options) {
      return client.requestJson<LearnerCourseListResponse>({
        method: "GET",
        path: buildCourseListPath(options),
        schema: learnerCourseListResponseSchema,
      })
    },
    async requestAiFeedback(input) {
      return client.requestJson<LearnerAiFeedbackTransitionResult>({
        headers: { "Idempotency-Key": input.idempotencyKey },
        method: "POST",
        path: `/learning/lessons/${input.lessonId}/steps/${input.stepId}/ai-feedback`,
        schema: learnerAiFeedbackTransitionResponseSchema,
      })
    },
    async startLesson(input) {
      return client.requestJson({
        body: {
          expectedCurriculumVersionId: input.expectedCurriculumVersionId,
        },
        method: "POST",
        path: `/learning/lessons/${input.lessonId}/start`,
        schema: learnerStartLessonResponseSchema,
      })
    },
  }
}

function buildProgressPath(
  options?: Parameters<WritingAppApi["getProgress"]>[0]
): string {
  if (options === undefined) return "/progress"

  const searchParams = new URLSearchParams()
  appendDefined(searchParams, "cursor", options.cursor)
  appendDefined(searchParams, "limit", options.limit)
  appendDefined(searchParams, "status", options.status)
  return withSearchParams("/progress", searchParams)
}

function buildCourseListPath(
  options?: Parameters<WritingAppApi["listCourses"]>[0]
): string {
  if (options === undefined) return "/courses"

  const searchParams = new URLSearchParams()
  appendDefined(searchParams, "category", options.category)
  appendDefined(searchParams, "cursor", options.cursor)
  appendDefined(searchParams, "limit", options.limit)
  appendDefined(searchParams, "query", options.query)
  appendDefined(searchParams, "sort", options.sort)
  return withSearchParams("/courses", searchParams)
}

function appendDefined(
  searchParams: URLSearchParams,
  key: string,
  value: number | string | undefined
): void {
  if (value !== undefined && value !== "") searchParams.set(key, String(value))
}

function withSearchParams(path: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString()
  return query === "" ? path : `${path}?${query}`
}
