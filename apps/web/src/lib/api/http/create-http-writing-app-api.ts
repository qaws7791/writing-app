import {
  mapCourseDetail,
  mapCourseList,
  mapProgress,
} from "@/features/courses/course-api-mappers"
import { mapAiFeedback, mapLesson } from "@/features/lessons/lesson-api-mappers"
import { mapProfile } from "@/features/profile/profile-api-mappers"
import { apiOk, type ApiResult } from "@/lib/api/api-result"
import {
  createOpenApiClient,
  type FetchLike,
  type TokenProvider,
} from "@/lib/api/http/openapi-client"
import type { BrowserApiBaseUrl } from "@/runtime-config"
import type { ServerApiBaseUrl } from "@/runtime-config-server"
import {
  courseDetailDtoSchema,
  courseListDtoSchema,
  lessonDtoSchema,
} from "@workspace/contracts/content"
import { aiFeedbackResultDtoSchema } from "@workspace/contracts/ai-feedback"
import {
  learnerProfileStatsDtoSchema,
  learnerProgressOverviewDtoSchema,
} from "@workspace/contracts/learning"
import { learnerAccountStatusSchema } from "@workspace/contracts/status"
import { z } from "zod"
import type {
  CompleteLessonResult,
  SaveLessonProgressResult,
  SaveLessonAnswerResult,
  WritingAppApi,
} from "@/lib/api/writing-app-api-port"
import type {
  ApiAiFeedbackResponse,
  ApiCompleteLessonResponse,
  ApiCourseDetailResponse,
  ApiCourseListResponse,
  ApiLessonResponse,
  ApiProfileResponse,
  ApiProgressResponse,
  ApiSaveLessonAnswerResponse,
  ApiSaveLessonProgressResponse,
} from "@/lib/api/writing-app-api-contract"

export function createHttpWritingAppApi({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: BrowserApiBaseUrl | ServerApiBaseUrl
  readonly fetch: FetchLike
  readonly tokenProvider: TokenProvider
}): WritingAppApi {
  const client = createOpenApiClient({
    baseUrl,
    fetch,
    tokenProvider,
  })

  return {
    async completeLesson(input) {
      return mapApiResult(
        await client.requestJson<ApiCompleteLessonResponse>({
          method: "POST",
          path: `/learning/lessons/${input.lessonId}/complete`,
          schema: savedResponseSchema,
        }),
        mapCompleteLessonResult
      )
    },
    async createAiFeedback(input) {
      return mapApiResult(
        await client.requestJson<ApiAiFeedbackResponse>({
          body: {
            answer: input.answer,
            lessonId: input.lessonId,
            stepId: input.stepId,
          },
          headers: { "Idempotency-Key": input.idempotencyKey },
          method: "POST",
          path: "/ai-feedback",
          schema: aiFeedbackResultDtoSchema,
        }),
        mapAiFeedback
      )
    },
    async getCourseDetail(courseId) {
      return mapApiResult(
        await client.requestJson<ApiCourseDetailResponse>({
          method: "GET",
          path: `/courses/${courseId}`,
          schema: courseDetailDtoSchema,
        }),
        mapCourseDetail
      )
    },
    async getLesson(lessonId) {
      return mapApiResult(
        await client.requestJson<ApiLessonResponse>({
          method: "GET",
          path: `/lessons/${lessonId}`,
          schema: lessonDtoSchema,
        }),
        mapLesson
      )
    },
    async getProfile() {
      return mapApiResult(
        await client.requestJson<ApiProfileResponse>({
          method: "GET",
          path: "/profile",
          schema: apiProfileResponseSchema,
        }),
        mapProfile
      )
    },
    async getProgress(options) {
      const path = buildProgressPath(options)

      return mapApiResult(
        await client.requestJson<ApiProgressResponse>({
          method: "GET",
          path,
          schema: apiProgressResponseSchema,
        }),
        mapProgress
      )
    },
    async listCourses() {
      return mapApiResult(
        await client.requestJson<ApiCourseListResponse>({
          method: "GET",
          path: "/courses",
          schema: courseListDtoSchema,
        }),
        mapCourseList
      )
    },
    async saveLessonAnswer(input) {
      return mapApiResult(
        await client.requestJson<ApiSaveLessonAnswerResponse>({
          body: input,
          method: "POST",
          path: "/learning/answers",
          schema: savedResponseSchema,
        }),
        mapSaveLessonAnswerResult
      )
    },
    async saveLessonProgress(input) {
      return mapApiResult(
        await client.requestJson<ApiSaveLessonProgressResponse>({
          body: { currentStepIndex: input.currentStepIndex },
          method: "POST",
          path: `/learning/lessons/${input.lessonId}/progress`,
          schema: savedResponseSchema,
        }),
        mapSaveLessonProgressResult
      )
    },
  }
}

const savedResponseSchema = z.object({
  saved: z.literal(true),
})

const apiProfileResponseSchema = z.object({
  stats: learnerProfileStatsDtoSchema,
  user: z.object({
    email: z.email(),
    id: z.string(),
    image: z.string().nullable(),
    joinedAt: z.string(),
    name: z.string(),
    status: learnerAccountStatusSchema,
  }),
})

const apiProgressResponseSchema = learnerProgressOverviewDtoSchema

function buildProgressPath(
  options?: Parameters<WritingAppApi["getProgress"]>[0]
): string {
  if (options?.status === undefined) {
    return "/progress"
  }

  const searchParams = new URLSearchParams({
    status: options.status,
  })

  return `/progress?${searchParams.toString()}`
}

function mapApiResult<TInput, TOutput>(
  result: ApiResult<TInput>,
  mapper: (input: TInput) => TOutput
): ApiResult<TOutput> {
  if (result.status === "error") {
    return result
  }

  return apiOk(mapper(result.value))
}

function mapSaveLessonAnswerResult(
  response: ApiSaveLessonAnswerResponse
): SaveLessonAnswerResult {
  return {
    saved: response.saved,
  }
}

function mapCompleteLessonResult(
  response: ApiCompleteLessonResponse
): CompleteLessonResult {
  return {
    saved: response.saved,
  }
}

function mapSaveLessonProgressResult(
  response: ApiSaveLessonProgressResponse
): SaveLessonProgressResult {
  return { saved: response.saved }
}
