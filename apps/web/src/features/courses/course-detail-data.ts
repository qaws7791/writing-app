import type { Brand, CourseId } from "@/features/courses/course-ids"

export type CourseChapterId = Brand<string, "course-chapter-id">
export type CourseLessonId = Brand<string, "course-lesson-id">

export interface CourseLesson {
  id: CourseLessonId
  lessonId: CourseLessonId
  title: string
  description: string
  completed: boolean
}

export interface CourseChapter {
  id: CourseChapterId
  title: string
  lessons: readonly CourseLesson[]
}

export interface CourseProgress {
  completedLessons: number
  totalLessons: number
  percentage: number
}

export interface CourseNextLesson {
  title: string
  description: string
  lessonId: CourseLessonId
}

export interface CourseDetail {
  id: CourseId
  title: string
  description: string
  progress: CourseProgress
  nextLesson: CourseNextLesson
  chapters: readonly CourseChapter[]
}
