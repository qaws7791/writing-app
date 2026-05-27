import { z } from "zod"

export const adminDatabaseUnavailableErrorDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("Database is unavailable."),
})

export const adminInvalidRequestErrorDtoSchema = z.object({
  code: z.literal("invalid-request"),
  message: z.string().min(1),
})

export const adminNotFoundErrorDtoSchema = z.object({
  code: z.literal("not-found"),
  message: z.string().min(1),
})

export type AdminDatabaseUnavailableErrorDto = z.infer<
  typeof adminDatabaseUnavailableErrorDtoSchema
>
export type AdminInvalidRequestErrorDto = z.infer<
  typeof adminInvalidRequestErrorDtoSchema
>
export type AdminNotFoundErrorDto = z.infer<typeof adminNotFoundErrorDtoSchema>

export type AdminErrorDto =
  | AdminDatabaseUnavailableErrorDto
  | AdminInvalidRequestErrorDto
  | AdminNotFoundErrorDto
