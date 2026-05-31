import { courseId, type CourseId } from "@/features/courses/course-ids"

export { courseId }
export type { Brand, CourseId } from "@/features/courses/course-ids"

export interface Course {
  id: CourseId
  title: string
  description: string
  lessonCount: number
}

export interface CourseCategory {
  id: string
  title: string
  courses: readonly Course[]
}
