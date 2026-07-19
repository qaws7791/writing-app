import type { ApiResult } from "@/shared/http/api-result"
import type {
  CompleteLearnerStepBody,
  CompleteLearnerStepResult,
  LearnerAiFeedbackTransitionResult,
  LearnerCourseCategoriesResponse,
  LearnerCourseDetailResponse,
  LearnerCourseListResponse,
  LearnerLessonResponse,
  LearnerProfileResponse,
  LearnerProgressResponse,
  LessonLearningState,
} from "@workspace/contracts/learning"

export type GetProgressOptions = {
  readonly cursor?: string
  readonly limit?: number
  readonly status?: "completed" | "in_progress"
}

export type ListCoursesOptions = {
  readonly category?: string
  readonly cursor?: string
  readonly limit?: number
  readonly query?: string
  readonly sort?:
    | "lesson-count-asc"
    | "lesson-count-desc"
    | "recommended"
    | "title-asc"
    | "title-desc"
}

export type WritingAppApi = {
  readonly completeStep: (input: {
    readonly lessonId: string
    readonly request: CompleteLearnerStepBody
    readonly stepId: string
  }) => Promise<ApiResult<CompleteLearnerStepResult>>
  readonly getCourseCategories: () => Promise<
    ApiResult<LearnerCourseCategoriesResponse>
  >
  readonly getCourseDetail: (
    courseId: string
  ) => Promise<ApiResult<LearnerCourseDetailResponse>>
  readonly getLesson: (
    lessonId: string
  ) => Promise<ApiResult<LearnerLessonResponse>>
  readonly getProfile: () => Promise<ApiResult<LearnerProfileResponse>>
  readonly getProgress: (
    options?: GetProgressOptions
  ) => Promise<ApiResult<LearnerProgressResponse>>
  readonly listCourses: (
    options?: ListCoursesOptions
  ) => Promise<ApiResult<LearnerCourseListResponse>>
  readonly requestAiFeedback: (input: {
    readonly idempotencyKey: string
    readonly lessonId: string
    readonly stepId: string
  }) => Promise<ApiResult<LearnerAiFeedbackTransitionResult>>
  readonly startLesson: (input: {
    readonly expectedCurriculumVersionId: string
    readonly lessonId: string
  }) => Promise<ApiResult<LessonLearningState>>
}
