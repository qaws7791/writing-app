import {
  AppError,
  assertExhaustiveHttpResult,
} from "@workspace/http-platform/errors"

import type { ResourceLibraryError } from "#resource-library/domain/resource-library-error"

export function mapResourceLibraryError(error: ResourceLibraryError): AppError {
  switch (error.kind) {
    case "resource-conflict":
      return new AppError({
        code:
          error.reason === "move-cycle"
            ? "RESOURCE_MOVE_CYCLE"
            : error.reason === "name-conflict"
              ? "RESOURCE_NAME_CONFLICT"
              : "RESOURCE_STALE_VERSION",
        message: "Resource library conflict",
        status: error.reason === "stale-version" ? 412 : 409,
      })
    case "resource-forbidden":
      return new AppError({
        code: "FORBIDDEN",
        message: "Forbidden",
        status: 403,
      })
    case "resource-not-found":
      return new AppError({
        code: "NOT_FOUND",
        message: "Not Found",
        status: 404,
      })
    case "resource-persistence-failure":
      return new AppError({
        code: "RESOURCE_LIBRARY_UNAVAILABLE",
        message: "Resource library unavailable",
        status: 503,
      })
    case "resource-storage-failure":
      return new AppError({
        code:
          error.compensation === "failed"
            ? "RESOURCE_ASSET_COMPENSATION_FAILED"
            : "RESOURCE_ASSET_STORE_UNAVAILABLE",
        message: "Resource asset store unavailable",
        status: 503,
      })
    case "resource-validation":
      return new AppError({
        code:
          error.reason === "depth-limit"
            ? "RESOURCE_DEPTH_LIMIT"
            : error.reason === "node-limit"
              ? "RESOURCE_NODE_LIMIT"
              : error.reason === "image-too-large"
                ? "PAYLOAD_TOO_LARGE"
                : "INVALID_REQUEST",
        message: "Invalid request",
        status:
          error.reason === "depth-limit" || error.reason === "node-limit"
            ? 422
            : error.reason === "image-too-large"
              ? 413
              : 400,
      })
  }

  return assertExhaustiveHttpResult(error)
}

export function preconditionRequiredResourceLibraryError(): AppError {
  return new AppError({
    code: "PRECONDITION_REQUIRED",
    message: "If-Match precondition required",
    status: 428,
  })
}
