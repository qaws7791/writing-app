import {
  mapCourseDetail,
  mapCourseList,
  mapProgress,
} from "@/features/courses/course-api-mappers"
import { mapLesson } from "@/features/lessons/lesson-api-mappers"
import { mapProfile } from "@/features/profile/profile-api-mappers"
import { apiOk, type ApiResult } from "@/lib/api/api-result"
import {
  createOpenApiClient,
  type FetchLike,
  type TokenProvider,
} from "@/lib/api/http/openapi-client"
import type {
  AiFeedbackResult,
  ApiAiFeedbackResponse,
  ApiCourseDetailResponse,
  ApiCourseListResponse,
  ApiLessonResponse,
  ApiProfileResponse,
  ApiProgressResponse,
  ApiSaveLessonAnswerResponse,
  WritingAppApi,
} from "@/lib/api/writing-app-api"

export function createHttpWritingAppApi({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: string
  readonly fetch: FetchLike
  readonly tokenProvider: TokenProvider
}): WritingAppApi {
  const client = createOpenApiClient({
    baseUrl,
    fetch,
    tokenProvider,
  })

  return {
    async createAiFeedback(input) {
      return mapApiResult(
        await client.requestJson<ApiAiFeedbackResponse>({
          body: input,
          method: "POST",
          path: "/ai-feedback",
        }),
        mapAiFeedbackResult
      )
    },
    async getCourseDetail(courseId) {
      return mapApiResult(
        await client.requestJson<ApiCourseDetailResponse>({
          method: "GET",
          path: `/courses/${courseId}`,
        }),
        mapCourseDetail
      )
    },
    async getLesson(lessonId) {
      return mapApiResult(
        await client.requestJson<ApiLessonResponse>({
          method: "GET",
          path: `/lessons/${lessonId}`,
        }),
        mapLesson
      )
    },
    async getProfile() {
      return mapApiResult(
        await client.requestJson<ApiProfileResponse>({
          method: "GET",
          path: "/profile",
        }),
        mapProfile
      )
    },
    async getProgress() {
      return mapApiResult(
        await client.requestJson<ApiProgressResponse>({
          method: "GET",
          path: "/progress",
        }),
        mapProgress
      )
    },
    async listCourses() {
      return mapApiResult(
        await client.requestJson<ApiCourseListResponse>({
          method: "GET",
          path: "/courses",
        }),
        mapCourseList
      )
    },
    async saveLessonAnswer(input) {
      return client.requestJson<ApiSaveLessonAnswerResponse>({
        body: input,
        method: "POST",
        path: "/learning/answers",
      })
    },
  }
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

function mapAiFeedbackResult(
  response: ApiAiFeedbackResponse
): AiFeedbackResult {
  return {
    improvements: response.improvements,
    nextAction: response.nextAction,
    remainingAttempts: response.remainingAttempts,
    score: response.score,
    scoreRange: response.scoreRange,
    showScore: response.showScore,
    strengths: response.strengths,
    summary: response.summary,
  }
}
