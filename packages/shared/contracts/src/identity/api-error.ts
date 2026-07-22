import { z } from "zod"

export const identityApiErrorCodeValues = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "IDENTITY_CONFLICT",
  "INVALID_STATUS_TRANSITION",
  "IDENTITY_SESSION_REVOCATION_FAILED",
  "INTERNAL_SERVER_ERROR",
] as const

export const identityApiErrorCodeSchema = z.enum(identityApiErrorCodeValues)

export const identityApiErrorSchema = z.strictObject({
  code: identityApiErrorCodeSchema,
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

export type IdentityApiError = z.infer<typeof identityApiErrorSchema>
