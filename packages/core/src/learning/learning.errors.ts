import { z } from "zod"

export const learningInvalidRequestErrorDtoSchema = z.object({
  code: z.literal("invalid-request"),
  message: z.string().min(1),
})

export type LearningInvalidRequestErrorDto = z.infer<
  typeof learningInvalidRequestErrorDtoSchema
>

export const learningNotFoundErrorDtoSchema = z.object({
  code: z.literal("not-found"),
  message: z.string().min(1),
})

export type LearningNotFoundErrorDto = z.infer<
  typeof learningNotFoundErrorDtoSchema
>

export const learningDatabaseUnavailableErrorDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("데이터베이스를 사용할 수 없습니다."),
})

export type LearningDatabaseUnavailableErrorDto = z.infer<
  typeof learningDatabaseUnavailableErrorDtoSchema
>

export type LearningErrorDto =
  | LearningInvalidRequestErrorDto
  | LearningNotFoundErrorDto
  | LearningDatabaseUnavailableErrorDto
