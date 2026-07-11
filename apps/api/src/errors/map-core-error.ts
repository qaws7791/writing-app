import { AppError } from "@workspace/hono/errors"
import type { AiFeedbackServiceError } from "@workspace/core/modules/ai-feedback"
import type { LearnerContentServiceError } from "@workspace/core/modules/content"
import type { LearningServiceError } from "@workspace/core/modules/learning"

export type ApiCoreError =
  | AiFeedbackServiceError
  | LearnerContentServiceError
  | LearningServiceError

export type ApiCoreResult<TValue> =
  | {
      readonly kind: "ok"
      readonly value: TValue
    }
  | {
      readonly error: ApiCoreError
      readonly kind: "err"
    }

export function unwrapApiCoreResult<TValue>(
  result: ApiCoreResult<TValue>
): TValue {
  if (result.kind === "err") {
    throw mapCoreError(result.error)
  }

  return result.value
}

export function mapCoreError(error: ApiCoreError): AppError {
  switch (error.kind) {
    case "invalid-request":
      return new AppError({
        code: "INVALID_REQUEST",
        message: "Invalid request",
        status: 400,
      })
    case "course-not-found":
    case "lesson-not-found":
      return new AppError({
        code: "NOT_FOUND",
        message: "Not Found",
        status: 404,
      })
    case "attempt-limit-exceeded":
      return new AppError({
        code: "ATTEMPT_LIMIT_EXCEEDED",
        message: "Attempt limit exceeded",
        status: 429,
      })
    case "attempt-in-progress":
      return new AppError({
        code: "ATTEMPT_IN_PROGRESS",
        message: "Attempt already in progress",
        status: 409,
      })
    case "provider-failed":
      return new AppError({
        code: "PROVIDER_UNAVAILABLE",
        message: "Provider unavailable",
        status: 503,
      })
  }
}
