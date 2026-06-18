import type { ZodError } from "zod"
import { errorJson } from "@/errors/error-response"
import type { ErrorResponse } from "@/errors/error-response"
import { formatZodPath } from "@/errors/utils"

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
  return (result: ValidationHookResult): Response | undefined => {
    if (result.success) {
      return undefined
    }

    const error: ErrorResponse = {
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
      errors: result.error.issues.map((issue) => ({
        path: formatZodPath(issue.path),
        message: issue.message,
        code: issue.code,
      })),
    }

    return errorJson(error, 400)
  }
}
