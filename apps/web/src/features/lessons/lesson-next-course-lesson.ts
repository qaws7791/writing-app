import type {
  CourseDetail,
  CourseLessonSummary,
} from "@/features/courses/course-types"

export function getNextCourseLesson(
  courseDetail: CourseDetail | undefined,
  lessonId: string
): CourseLessonSummary | null {
  if (courseDetail === undefined) {
    return null
  }

  const lessons = courseDetail.units
    .flatMap((unit) =>
      unit.lessons.map((unitLesson) => ({
        lesson: unitLesson,
        unitOrder: unit.order,
      }))
    )
    .sort(
      (left, right) =>
        left.unitOrder - right.unitOrder ||
        left.lesson.order - right.lesson.order
    )
  const lessonIndex = lessons.findIndex((item) => item.lesson.id === lessonId)

  if (lessonIndex < 0) {
    return null
  }

  return lessons[lessonIndex + 1]?.lesson ?? null
}
