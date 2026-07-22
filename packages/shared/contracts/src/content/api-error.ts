import { z } from "zod"

export const contentApiErrorCodeValues = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "CONTENT_CONFLICT",
  "CONTENT_IMMUTABLE_REVISION",
  "CONTENT_RESET_FORBIDDEN",
  "PRECONDITION_REQUIRED",
  "INTERNAL_SERVER_ERROR",
] as const

export const contentApiErrorCodeSchema = z.enum(contentApiErrorCodeValues)

export const contentApiErrorSchema = z.strictObject({
  code: contentApiErrorCodeSchema,
  errors: z
    .array(
      z.strictObject({
        code: z.string().optional(),
        message: z.string(),
        path: z.string(),
      })
    )
    .optional(),
  message: z.string(),
  requestId: z.string().min(1).optional(),
})

export type ContentApiError = z.infer<typeof contentApiErrorSchema>
