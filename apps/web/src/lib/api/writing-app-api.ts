import type { Course, CourseCategory } from "@/features/courses/course-data"
import type {
  CourseDetail,
  CourseProgress,
} from "@/features/courses/course-detail-data"
import type {
  Lesson,
  LessonId,
  LessonStepId,
} from "@/features/lessons/lesson-types"
import type { ApiResult } from "@/lib/api/api-result"

export interface CurrentUser {
  email: string
  id: string
  image: string | null
  name: string
}

export interface ProfileSummary {
  completedLessonCount: number
  courseCount: number
}

export interface LessonAnswer {
  answer: string
  stepId: LessonStepId
}

export interface LessonProgress {
  answers: readonly LessonAnswer[]
  currentStepId: LessonStepId
  lessonId: LessonId
  status: "not-started" | "in-progress" | "completed"
  stepOrder: number
}

export interface SaveLessonProgressInput {
  currentStepId: LessonStepId
  stepOrder: number
}

export interface SaveLessonAnswerInput {
  answer: string
  stepId: LessonStepId
}

export interface CompleteLessonResult {
  completedAt: string
  completedCount: number
  lessonId: LessonId
  status: "completed"
  wasAlreadyCompleted: boolean
}

export interface CreateAiFeedbackInput {
  answer?: string
  feedbackStepId: LessonStepId
  lessonId: LessonId
}

export interface AiFeedbackResult {
  improvements: readonly string[]
  nextAction: string
  score: number
  scoreRange: readonly [number, number]
  strengths: readonly string[]
  summary: string
}

export interface WritingAppApi {
  listCourseCategories(): Promise<ApiResult<readonly CourseCategory[]>>
  searchCourses(query: string): Promise<ApiResult<readonly Course[]>>
  getCourseDetail(courseId: Course["id"]): Promise<ApiResult<CourseDetail>>
  getLesson(lessonId: LessonId): Promise<ApiResult<Lesson>>
  getCurrentUser(): Promise<ApiResult<CurrentUser>>
  getProfile(): Promise<ApiResult<ProfileSummary>>
  getCourseProgress(courseId: Course["id"]): Promise<ApiResult<CourseProgress>>
  getLessonProgress(lessonId: LessonId): Promise<ApiResult<LessonProgress>>
  saveLessonProgress(
    lessonId: LessonId,
    input: SaveLessonProgressInput
  ): Promise<ApiResult<LessonProgress>>
  saveLessonAnswer(
    lessonId: LessonId,
    input: SaveLessonAnswerInput
  ): Promise<ApiResult<{ saved: true }>>
  completeLesson(lessonId: LessonId): Promise<ApiResult<CompleteLessonResult>>
  createAiFeedback(
    input: CreateAiFeedbackInput
  ): Promise<ApiResult<AiFeedbackResult>>
}
