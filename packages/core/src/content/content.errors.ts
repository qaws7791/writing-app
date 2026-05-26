import { z } from "zod"

export const courseNotFoundErrorDtoSchema = z.object({
  code: z.literal("course-not-found"),
  message: z.literal("Course was not found."),
  courseId: z.string().min(1),
})

export type CourseNotFoundErrorDto = {
  code: "course-not-found"
  message: "Course was not found."
  courseId: string
}

export const lessonNotFoundErrorDtoSchema = z.object({
  code: z.literal("lesson-not-found"),
  message: z.literal("Lesson was not found."),
  lessonId: z.string().min(1),
})

export type LessonNotFoundErrorDto = {
  code: "lesson-not-found"
  message: "Lesson was not found."
  lessonId: string
}

export const databaseUnavailableErrorDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("Database is unavailable."),
})

export type DatabaseUnavailableErrorDto = {
  code: "database-unavailable"
  message: "Database is unavailable."
}

export const invalidContentSeedErrorDtoSchema = z.object({
  code: z.literal("invalid-content-seed"),
  message: z.string().min(1),
  lessonId: z.string().min(1).optional(),
})

export type InvalidContentSeedErrorDto = {
  code: "invalid-content-seed"
  message: string
  lessonId?: string
}

export const invalidRequestErrorDtoSchema = z.object({
  code: z.literal("invalid-request"),
  message: z.string().min(1),
})

export type InvalidRequestErrorDto = {
  code: "invalid-request"
  message: string
}

export type ContentErrorDto =
  | CourseNotFoundErrorDto
  | LessonNotFoundErrorDto
  | DatabaseUnavailableErrorDto
  | InvalidContentSeedErrorDto
  | InvalidRequestErrorDto

export const contentErrorDtoSchema = z.discriminatedUnion("code", [
  courseNotFoundErrorDtoSchema,
  lessonNotFoundErrorDtoSchema,
  databaseUnavailableErrorDtoSchema,
  invalidContentSeedErrorDtoSchema,
  invalidRequestErrorDtoSchema,
])
