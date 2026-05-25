export type CourseNotFoundErrorDto = {
  code: "course-not-found"
  message: "Course was not found."
  courseId: string
}

export type LessonNotFoundErrorDto = {
  code: "lesson-not-found"
  message: "Lesson was not found."
  lessonId: string
}

export type DatabaseUnavailableErrorDto = {
  code: "database-unavailable"
  message: "Database is unavailable."
}

export type InvalidContentSeedErrorDto = {
  code: "invalid-content-seed"
  message: string
  lessonId?: string
}

export type ContentErrorDto =
  | CourseNotFoundErrorDto
  | LessonNotFoundErrorDto
  | DatabaseUnavailableErrorDto
  | InvalidContentSeedErrorDto
