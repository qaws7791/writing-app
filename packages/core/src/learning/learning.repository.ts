import type { CourseId, LessonId } from "../content"
import type { UserId, LessonProgressStatus } from "./learning.ids"

export interface CourseProgressRecord {
  completedCount: number
  courseId: CourseId
  lastLessonId?: LessonId
}

export interface LessonProgressRecord {
  completedAt?: Date | null
  courseId: CourseId
  currentStepId: string
  lessonId: LessonId
  status: LessonProgressStatus
  stepOrder: number
}

export interface LessonAnswerRecord {
  answer: string
  lessonId: LessonId
  stepId: string
}

export interface UpsertCourseProgressInput {
  courseId: CourseId
  lastLessonId: LessonId
  userId: UserId
}

export interface UpsertLessonProgressInput {
  courseId: CourseId
  currentStepId: string
  lessonId: LessonId
  status: LessonProgressStatus
  stepOrder: number
  userId: UserId
}

export interface UpsertLessonAnswerInput {
  answer: string
  lessonId: LessonId
  stepId: string
  userId: UserId
}

export interface CompleteLessonInput {
  courseId: CourseId
  finalStepId: string
  lessonId: LessonId
  stepOrder: number
  userId: UserId
}

export interface CompleteLessonRecord {
  completedAt: Date
  completedCount: number
  wasAlreadyCompleted: boolean
}

export interface LearningRepository {
  findCourseProgress(
    userId: UserId,
    courseId: CourseId
  ): Promise<CourseProgressRecord | undefined>
  upsertCourseProgress(input: UpsertCourseProgressInput): Promise<void>
  findLessonProgress(
    userId: UserId,
    lessonId: LessonId
  ): Promise<LessonProgressRecord | undefined>
  upsertLessonProgress(
    input: UpsertLessonProgressInput
  ): Promise<LessonProgressRecord>
  listLessonProgressByCourse(
    userId: UserId,
    courseId: CourseId
  ): Promise<LessonProgressRecord[]>
  listCourseLessonIds(courseId: CourseId): Promise<LessonId[]>
  courseIncludesLesson(courseId: CourseId, lessonId: LessonId): Promise<boolean>
  listInProgressCourses(userId: UserId): Promise<CourseProgressRecord[]>
  listLessonAnswers(
    userId: UserId,
    lessonId: LessonId
  ): Promise<LessonAnswerRecord[]>
  upsertLessonAnswer(input: UpsertLessonAnswerInput): Promise<void>
  completeLesson(input: CompleteLessonInput): Promise<CompleteLessonRecord>
}
