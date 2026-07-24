import type { ZodError } from "zod"
import type { Context } from "hono"
import { errorJson } from "#http-platform/errors/error-response"
import type { ErrorResponse } from "#http-platform/errors/error-response"
import { formatZodPath } from "#http-platform/errors/zod-path"

type ValidationHookResult =
  | {
      success: true
      data: unknown
      target?: string
    }
  | {
      success: false
      error: ZodError
      target?: string
    }

export function createValidationErrorHook() {
  return (
    result: ValidationHookResult,
    context: Context
  ): Response | undefined => {
    if (result.success) {
      return undefined
    }

    const error: ErrorResponse = {
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
      requestId: readRequestId(context.get("requestId")),
      violations: result.error.issues.map((issue) => ({
        path: formatZodPath(issue.path),
        message: issue.message,
        code: issue.code,
      })),
    }

    const response = errorJson(error, 400)
    response.headers.set("x-request-id", error.requestId)
    return response
  }
}

function readRequestId(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : crypto.randomUUID()
}
