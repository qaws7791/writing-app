import type { CourseId, CurriculumVersionId, LessonId } from "@/content"
import type { UserId, LessonProgressStatus } from "@/learning/learning.ids"

export interface CourseProgressRecord {
  completedCount: number
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  lastLessonId?: LessonId
}

export interface LessonProgressRecord {
  completedAt?: Date | null
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
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
  curriculumVersionId: CurriculumVersionId
  lastLessonId: LessonId
  userId: UserId
}

export interface UpsertLessonProgressInput {
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
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
  curriculumVersionId: CurriculumVersionId
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
    courseId: CourseId,
    curriculumVersionId: CurriculumVersionId
  ): Promise<LessonProgressRecord[]>
  findLatestPublishedCurriculumVersionId(
    courseId: CourseId
  ): Promise<CurriculumVersionId | undefined>
  listCurriculumVersionLessonIds(
    curriculumVersionId: CurriculumVersionId
  ): Promise<LessonId[]>
  curriculumVersionIncludesLesson(
    curriculumVersionId: CurriculumVersionId,
    lessonId: LessonId
  ): Promise<boolean>
  listInProgressCourses(userId: UserId): Promise<CourseProgressRecord[]>
  listLessonAnswers(
    userId: UserId,
    lessonId: LessonId
  ): Promise<LessonAnswerRecord[]>
  upsertLessonAnswer(input: UpsertLessonAnswerInput): Promise<void>
  completeLesson(input: CompleteLessonInput): Promise<CompleteLessonRecord>
}
