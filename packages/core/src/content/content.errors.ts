import { z } from "zod"

export const courseNotFoundErrorDtoSchema = z.object({
  code: z.literal("course-not-found"),
  message: z.literal("코스를 찾을 수 없습니다."),
  courseId: z.string().min(1),
})

export type CourseNotFoundErrorDto = {
  code: "course-not-found"
  message: "코스를 찾을 수 없습니다."
  courseId: string
}

export const lessonNotFoundErrorDtoSchema = z.object({
  code: z.literal("lesson-not-found"),
  message: z.literal("레슨을 찾을 수 없습니다."),
  lessonId: z.string().min(1),
})

export type LessonNotFoundErrorDto = {
  code: "lesson-not-found"
  message: "레슨을 찾을 수 없습니다."
  lessonId: string
}

export const databaseUnavailableErrorDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("데이터베이스를 사용할 수 없습니다."),
})

export type DatabaseUnavailableErrorDto = {
  code: "database-unavailable"
  message: "데이터베이스를 사용할 수 없습니다."
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
