import type { CourseId, LessonId } from "./content.ids"

export type RawContentRepositoryLessonStep = {
  content: unknown
  id: unknown
  order: unknown
  points: unknown
  required: unknown
  type: unknown
}

export type RawContentRepositoryLesson = {
  categoryId: unknown
  courseId: unknown
  id: unknown
  nextLessonId?: unknown
  steps: RawContentRepositoryLessonStep[]
  title: unknown
  unitNumber: unknown
}

export interface ContentRepository {
  listCourseCategories(): Promise<unknown>
  findCourseDetail(courseId: CourseId): Promise<unknown | undefined>
  findLesson(
    lessonId: LessonId
  ): Promise<RawContentRepositoryLesson | undefined>
}
