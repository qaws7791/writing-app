import type { CourseDetail } from "@/features/courses/course-detail-data"
import type { CourseId } from "@/features/courses/course-ids"
import { lessonId } from "@/features/lessons/lesson-ids"
import type { LessonId } from "@/features/lessons/lesson-types"

export type LessonStatus = "completed" | "next-up" | "locked"

export interface HomeLesson {
  id: LessonId
  name: string
  status: LessonStatus
}

export interface InProgressCourse {
  id: CourseId
  title: string
  description: string
  completedLessons: number
  totalLessons: number
  progressPercent: number
  lessons: readonly HomeLesson[]
}

export function createInProgressCourse(course: CourseDetail): InProgressCourse {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    completedLessons: course.progress.completedLessons,
    totalLessons: course.progress.totalLessons,
    progressPercent: course.progress.percentage,
    lessons: createHomeLessons(course),
  }
}

function createHomeLessons(course: CourseDetail): readonly HomeLesson[] {
  const lessons = course.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      ...lesson,
      name: lesson.title,
    }))
  )
  const nextLessonIndex = lessons.findIndex(
    (lesson) => lesson.lessonId === course.nextLesson.lessonId
  )
  const rows: HomeLesson[] = []
  const completedLesson = [
    ...lessons.slice(
      0,
      nextLessonIndex >= 0 ? nextLessonIndex : lessons.length
    ),
  ]
    .reverse()
    .find((lesson) => lesson.completed)

  if (completedLesson) {
    rows.push({
      id: lessonId(String(completedLesson.lessonId)),
      name: completedLesson.name,
      status: "completed",
    })
  }

  const nextLesson = lessons[nextLessonIndex]
  if (nextLesson) {
    rows.push({
      id: lessonId(String(nextLesson.lessonId)),
      name: nextLesson.name,
      status: "next-up",
    })
  }

  return rows
}
