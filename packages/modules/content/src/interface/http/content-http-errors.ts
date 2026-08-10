import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"

import type { ContentError } from "#content/domain/content-error"

export function mapContentError(error: ContentError): AppError {
  switch (error.kind) {
    case "content-asset-invalid":
      return error.reason === "image-too-large" ||
        error.reason === "processed-image-too-large"
        ? contentHttpError(
            413,
            "CONTENT_ASSET_TOO_LARGE",
            "Content asset exceeds the size limit"
          )
        : contentHttpError(
            400,
            "CONTENT_ASSET_INVALID",
            "Content asset is invalid"
          )
    case "content-asset-persistence-failed":
      return contentHttpError(
        503,
        "CONTENT_ASSET_PERSISTENCE_UNAVAILABLE",
        "Content asset persistence is unavailable"
      )
    case "content-asset-storage-failed":
      return contentHttpError(
        503,
        "CONTENT_ASSET_STORAGE_UNAVAILABLE",
        "Content asset storage is unavailable"
      )
    case "content-maintenance-invalid":
      return contentHttpError(
        400,
        "VALIDATION_FAILED",
        "Content maintenance input is invalid"
      )
    case "content-conflict":
      return contentHttpError(
        409,
        "CONTENT_CONFLICT",
        "Content revision conflict"
      )
    case "content-immutable-revision":
      return contentHttpError(
        409,
        "CONTENT_IMMUTABLE_REVISION",
        "Published content revision is immutable"
      )
    case "content-idempotency-conflict":
      return contentHttpError(
        409,
        "CONTENT_IDEMPOTENCY_CONFLICT",
        "Content change idempotency conflict"
      )
    case "content-not-found":
      return contentHttpError(404, "NOT_FOUND", "Not Found")
    case "content-validation-failed":
      return contentHttpError(
        422,
        "VALIDATION_FAILED",
        `Content validation failed: ${error.reason}`
      )
  }

  return assertExhaustiveHttpResult(error)
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
  status: 400 | 404 | 409 | 413 | 422 | 428 | 503,
  code:
    | "CONTENT_ASSET_INVALID"
    | "CONTENT_ASSET_PERSISTENCE_UNAVAILABLE"
    | "CONTENT_ASSET_STORAGE_UNAVAILABLE"
    | "CONTENT_ASSET_TOO_LARGE"
    | "CONTENT_CONFLICT"
    | "CONTENT_IDEMPOTENCY_CONFLICT"
    | "CONTENT_IMMUTABLE_REVISION"
    | "NOT_FOUND"
    | "PRECONDITION_REQUIRED"
    | "VALIDATION_FAILED",
  message: string
): AppError {
  return new AppError({ code, message, status })
}
