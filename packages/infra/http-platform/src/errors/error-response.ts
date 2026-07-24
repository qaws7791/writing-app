import { apiErrorSchema, type ApiError } from "@workspace/contracts/api-error"
import type { ErrorStatusCode } from "#http-platform/errors/status"

const ERROR_JSON_CONTENT_TYPE = "application/json" as const

export const ErrorResponseSchema = apiErrorSchema

export type ErrorResponse = ApiError

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
