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
import {
  courseDetailDtoSchema,
  courseListDtoSchema,
  courseVisualKeySchema,
  lessonDtoSchema,
} from "@workspace/core/content"
import { aiFeedbackResultDtoSchema } from "@workspace/core/ai-feedback"
import { z } from "zod"
import type {
  AiFeedbackResult,
  ApiAiFeedbackResponse,
  ApiCompleteLessonResponse,
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
    async completeLesson(input) {
      return client.requestJson<ApiCompleteLessonResponse>({
        body: {
          currentStepIndex: input.currentStepIndex,
        },
        method: "POST",
        path: `/learning/lessons/${input.lessonId}/complete`,
        schema: savedResponseSchema,
      })
    },
    async createAiFeedback(input) {
      return mapApiResult(
        await client.requestJson<ApiAiFeedbackResponse>({
          body: input,
          method: "POST",
          path: "/ai-feedback",
          schema: aiFeedbackResultDtoSchema,
        }),
        mapAiFeedbackResult
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
    async getProgress() {
      return mapApiResult(
        await client.requestJson<ApiProgressResponse>({
          method: "GET",
          path: "/progress",
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
      return client.requestJson<ApiSaveLessonAnswerResponse>({
        body: input,
        method: "POST",
        path: "/learning/answers",
        schema: savedResponseSchema,
      })
    },
  }
}

const nonNegativeIntegerSchema = z.number().int().nonnegative()

const savedResponseSchema = z.object({
  saved: z.literal(true),
})

const apiProfileResponseSchema = z.object({
  stats: z.object({
    completedLessons: nonNegativeIntegerSchema,
    currentStreakDays: nonNegativeIntegerSchema,
    lastActiveDate: z.string().nullable(),
    progressPercent: nonNegativeIntegerSchema.max(100),
    totalLessons: nonNegativeIntegerSchema,
  }),
  user: z.object({
    email: z.email(),
    id: z.string(),
    image: z.string().nullable(),
    joinedAt: z.string(),
    name: z.string(),
    status: z.enum(["active", "deleted", "suspended"]),
  }),
})

const progressLessonSchema = z.object({
  courseId: z.string().optional(),
  currentStepIndex: nonNegativeIntegerSchema.nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: z.string(),
  status: z.enum(["available", "completed", "locked"]),
  title: z.string(),
})

const apiProgressResponseSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string(),
      lessons: z.array(progressLessonSchema),
      nextLessons: z.array(progressLessonSchema.required({ courseId: true })),
      progressPercent: nonNegativeIntegerSchema.max(100),
      title: z.string(),
      visualKey: courseVisualKeySchema,
    })
  ),
  user: z.object({
    currentStreakDays: nonNegativeIntegerSchema,
  }),
})

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
