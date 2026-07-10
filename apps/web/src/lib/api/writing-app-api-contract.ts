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
export type ApiSaveLessonProgressResponse = ApiResponseBody<
  "saveLessonProgress",
  200
>
export type ApiAiFeedbackResponse = ApiResponseBody<"createAiFeedback", 200>
