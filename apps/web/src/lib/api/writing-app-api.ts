import type { Course, CourseCategory } from "@/features/courses/course-data"
import type {
  CourseDetail,
  CourseNextLesson,
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

export interface ProgressCourse {
  completedLessons: number
  courseId: Course["id"]
  nextLessonId?: CourseNextLesson["lessonId"]
  percentage: number
  totalLessons: number
}

export interface ProgressCourseList {
  courses: readonly ProgressCourse[]
}

export interface CurriculumUpgradeVersion {
  id: string
  title: string
  versionNumber: number
}

export interface CurriculumUpgradeTargetVersion extends CurriculumUpgradeVersion {
  changelog: string
}

export type CurriculumUpgradeNotice =
  | {
      courseId: Course["id"]
      status: "not-available"
    }
  | {
      completedCount: number
      courseId: Course["id"]
      fromVersion: CurriculumUpgradeVersion
      message: string
      migrationId: string
      status: "available"
      toVersion: CurriculumUpgradeTargetVersion
      totalLessons: number
    }

export interface CurriculumUpgradeApplication {
  completedLessonCount: number
  completedLessonIds: readonly LessonId[]
  courseId: Course["id"]
  createdAt: string
  fromVersionId: string
  id: string
  migrationId: string
  preservedLessonIds: readonly LessonId[]
  skippedLessonIds: readonly LessonId[]
  status: "completed"
  toVersionId: string
  updatedAt: string
}

export interface DismissCurriculumUpgradeResult {
  courseId: Course["id"]
  dismissedAt: string
  fromVersionId: string
  status: "dismissed"
  toVersionId: string
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
  listProgress(): Promise<ApiResult<ProgressCourseList>>
  getCourseProgress(courseId: Course["id"]): Promise<ApiResult<CourseProgress>>
  getCurriculumUpgrade(
    courseId: Course["id"]
  ): Promise<ApiResult<CurriculumUpgradeNotice>>
  applyCurriculumUpgrade(
    courseId: Course["id"]
  ): Promise<ApiResult<CurriculumUpgradeApplication>>
  dismissCurriculumUpgrade(
    courseId: Course["id"]
  ): Promise<ApiResult<DismissCurriculumUpgradeResult>>
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
