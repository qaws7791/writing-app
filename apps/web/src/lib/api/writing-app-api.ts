import type {
  CourseDetail,
  CourseSummary,
  ProgressCourseList,
} from "@/features/courses/course-types"
import type { Lesson } from "@/features/lessons/lesson-types"
import type {
  LessonStartedAnswer,
  LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import type { LearnerProfile } from "@/features/profile/profile-types"
import type { ApiResult } from "@/lib/api/api-result"
import type { operations } from "@/lib/api/generated/writing-app-api"

export type ApiResponseBody<
  TOperation extends keyof operations,
  TStatus extends keyof operations[TOperation]["responses"],
> = operations[TOperation]["responses"][TStatus] extends {
  content: {
    "application/json": infer TBody
  }
}
  ? TBody
  : never

export type ApiProfileResponse = ApiResponseBody<"getProfile", 200>
export type ApiProgressResponse = ApiResponseBody<"getProgress", 200>
export type ApiCourseListResponse = ApiResponseBody<"getCourses", 200>
export type ApiCourseDetailResponse = ApiResponseBody<"getCourseDetail", 200>
export type ApiLessonResponse = ApiResponseBody<"getLesson", 200>
export type ApiSaveLessonAnswerResponse = ApiResponseBody<
  "saveLessonAnswer",
  200
>
export type ApiCompleteLessonResponse = ApiResponseBody<"completeLesson", 200>
export type ApiAiFeedbackResponse = ApiResponseBody<"createAiFeedback", 200>

export type SaveLessonAnswerInput = {
  readonly answer: LessonStartedAnswer | LessonStepAnswerPayload
  readonly lessonId: string
  readonly stepId: string
}

export type CompleteLessonInput = {
  readonly currentStepIndex: number
  readonly lessonId: string
}

export type CreateAiFeedbackInput = {
  readonly answer: string
  readonly lessonId: string
  readonly stepId: string
}

export type AiFeedbackResult = {
  readonly improvements: readonly string[]
  readonly nextAction: string
  readonly remainingAttempts: number
  readonly score: number
  readonly scoreRange: readonly [number, number]
  readonly showScore: boolean
  readonly strengths: readonly string[]
  readonly summary: string
}

export type WritingAppApi = {
  readonly completeLesson: (
    input: CompleteLessonInput
  ) => Promise<ApiResult<ApiCompleteLessonResponse>>
  readonly createAiFeedback: (
    input: CreateAiFeedbackInput
  ) => Promise<ApiResult<AiFeedbackResult>>
  readonly getCourseDetail: (
    courseId: string
  ) => Promise<ApiResult<CourseDetail>>
  readonly getLesson: (lessonId: string) => Promise<ApiResult<Lesson>>
  readonly getProfile: () => Promise<ApiResult<LearnerProfile>>
  readonly getProgress: () => Promise<ApiResult<ProgressCourseList>>
  readonly listCourses: () => Promise<ApiResult<readonly CourseSummary[]>>
  readonly saveLessonAnswer: (
    input: SaveLessonAnswerInput
  ) => Promise<ApiResult<ApiSaveLessonAnswerResponse>>
}
