import { z } from "zod"

export const learningInvalidRequestErrorDtoSchema = z.object({
  code: z.literal("invalid-request"),
  message: z.string().min(1),
})

export type LearningInvalidRequestErrorDto = z.infer<
  typeof learningInvalidRequestErrorDtoSchema
>

export const learningDatabaseUnavailableErrorDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("Database is unavailable."),
})

export type LearningDatabaseUnavailableErrorDto = z.infer<
  typeof learningDatabaseUnavailableErrorDtoSchema
>

export type LearningErrorDto =
  | LearningInvalidRequestErrorDto
  | LearningDatabaseUnavailableErrorDto
