import { AppError } from "@workspace/http-platform/errors"

import type { ContentError } from "#content/domain/content-error"

export function mapContentError(error: ContentError): AppError {
  switch (error.kind) {
    case "content-conflict":
      return contentHttpError(
        409,
        "CONTENT_CONFLICT",
        "Content revision conflict"
      )
    case "content-forbidden":
      return contentHttpError(403, "FORBIDDEN", "Forbidden")
    case "content-immutable-revision":
      return contentHttpError(
        409,
        "CONTENT_IMMUTABLE_REVISION",
        "Published content revision is immutable"
      )
    case "content-not-found":
      return contentHttpError(404, "NOT_FOUND", "Not Found")
    case "content-reset-forbidden":
      return contentHttpError(
        403,
        "CONTENT_RESET_FORBIDDEN",
        "Content reset is forbidden in this environment"
      )
    case "content-validation-failed":
      return contentHttpError(
        422,
        "VALIDATION_FAILED",
        `Content validation failed: ${error.reason}`
      )
  }
}

export function invalidContentRequestError(): AppError {
  return contentHttpError(400, "VALIDATION_FAILED", "Invalid content request")
}

export function contentPreconditionRequiredError(): AppError {
  return contentHttpError(
    428,
    "PRECONDITION_REQUIRED",
    "If-Match precondition required"
  )
}

function contentHttpError(
  status: 400 | 403 | 404 | 409 | 422 | 428,
  code:
    | "CONTENT_CONFLICT"
    | "CONTENT_IMMUTABLE_REVISION"
    | "CONTENT_RESET_FORBIDDEN"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "PRECONDITION_REQUIRED"
    | "VALIDATION_FAILED",
  message: string
): AppError {
  return new AppError({ code, message, status })
}
