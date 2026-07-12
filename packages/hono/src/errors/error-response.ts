import { z } from "@hono/zod-openapi"
import type { ErrorStatusCode } from "#hono/errors/status"

export const ERROR_JSON_CONTENT_TYPE = "application/json" as const

export const ErrorResponseSchema = z
  .object({
    code: z.string().openapi({
      example: "VALIDATION_FAILED",
    }),
    message: z.string().openapi({
      example: "Request validation failed",
    }),
    errors: z
      .array(
        z.object({
          path: z.string().openapi({
            example: "email",
          }),
          message: z.string().openapi({
            example: "Invalid email",
          }),
          code: z.string().optional().openapi({
            example: "invalid_string",
          }),
        })
      )
      .optional(),
  })
  .openapi("ErrorResponse")

export type ErrorResponse = {
  code: string
  message: string
  errors?: Array<{
    path: string
    message: string
    code?: string
  }>
}

export function errorJson(
  error: ErrorResponse,
  status: ErrorStatusCode
): Response {
  return new Response(JSON.stringify(error), {
    status,
    headers: {
      "Content-Type": ERROR_JSON_CONTENT_TYPE,
    },
  })
}
