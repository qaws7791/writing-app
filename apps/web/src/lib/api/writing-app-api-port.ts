import type {
  CourseDetail,
  CourseSummary,
  ProgressCourseList,
} from "@/features/courses/course-types"
import type {
  LessonAiFeedback,
  LessonStartedAnswer,
  LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import type { Lesson } from "@/features/lessons/lesson-types"
import type { LearnerProfile } from "@/features/profile/profile-types"
import type { ApiResult } from "@/lib/api/api-result"

export type SaveLessonAnswerInput = {
  readonly answer: LessonStartedAnswer | LessonStepAnswerPayload
  readonly lessonId: string
  readonly stepId: string
}

export type CompleteLessonInput = {
  readonly lessonId: string
}

export type SaveLessonProgressInput = {
  readonly currentStepIndex: number
  readonly lessonId: string
}

export type CreateAiFeedbackInput = {
  readonly answer: string
  readonly lessonId: string
  readonly stepId: string
}

export type SaveLessonAnswerResult = {
  readonly saved: boolean
}

export type CompleteLessonResult = {
  readonly saved: boolean
}

export type SaveLessonProgressResult = {
  readonly saved: boolean
}

export type GetProgressOptions = {
  readonly status?: "completed" | "in_progress"
}

export type WritingAppApi = {
  readonly completeLesson: (
    input: CompleteLessonInput
  ) => Promise<ApiResult<CompleteLessonResult>>
  readonly createAiFeedback: (
    input: CreateAiFeedbackInput
  ) => Promise<ApiResult<LessonAiFeedback>>
  readonly getCourseDetail: (
    courseId: string
  ) => Promise<ApiResult<CourseDetail>>
  readonly getLesson: (lessonId: string) => Promise<ApiResult<Lesson>>
  readonly getProfile: () => Promise<ApiResult<LearnerProfile>>
  readonly getProgress: (
    options?: GetProgressOptions
  ) => Promise<ApiResult<ProgressCourseList>>
  readonly listCourses: () => Promise<ApiResult<readonly CourseSummary[]>>
  readonly saveLessonAnswer: (
    input: SaveLessonAnswerInput
  ) => Promise<ApiResult<SaveLessonAnswerResult>>
  readonly saveLessonProgress: (
    input: SaveLessonProgressInput
  ) => Promise<ApiResult<SaveLessonProgressResult>>
}
