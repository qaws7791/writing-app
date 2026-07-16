import { AppError } from "@workspace/hono/errors"
import type { AdminOwnerMutationResult } from "@workspace/core/admin"
import type { AdminCourseEditorSaveResult } from "@workspace/core/admin"

export function invalidAdminRequestError(): AppError {
  return new AppError({
    code: "INVALID_REQUEST",
    message: "Invalid request",
    status: 400,
  })
}

export function unauthorizedAdminError(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    status: 401,
  })
}

export function forbiddenAdminError(): AppError {
  return new AppError({
    code: "FORBIDDEN",
    message: "Forbidden",
    status: 403,
  })
}

export function unwrapAdminOwnerMutationResult<TValue>(
  result: AdminOwnerMutationResult<TValue>
): TValue {
  switch (result.kind) {
    case "forbidden":
      throw forbiddenAdminError()
    case "not-found":
      throw notFoundAdminError()
    case "ok":
      return result.value
  }
}

export function notFoundAdminError(): AppError {
  return new AppError({
    code: "NOT_FOUND",
    message: "Not Found",
    status: 404,
  })
}

export function preconditionRequiredAdminError(): AppError {
  return new AppError({
    code: "PRECONDITION_REQUIRED",
    message: "If-Match precondition required",
    status: 428,
  })
}

export function payloadTooLargeAdminError(): AppError {
  return new AppError({
    code: "PAYLOAD_TOO_LARGE",
    message: "Payload too large",
    status: 413,
  })
}

export function unwrapAdminCourseEditorSaveResult(
  result: AdminCourseEditorSaveResult
) {
  switch (result.kind) {
    case "invalid-reference":
      throw invalidAdminRequestError()
    case "stale-revision":
      throw new AppError({
        code: "STALE_REVISION",
        message: "Course editor revision conflict",
        status: 409,
      })
    default:
      return unwrapAdminOwnerMutationResult(result)
  }
}

export function resourceAssetStoreUnavailableAdminError(): AppError {
  return new AppError({
    code: "RESOURCE_ASSET_STORE_UNAVAILABLE",
    message: "Resource asset store unavailable",
    status: 503,
  })
}

export function resourceDocumentQuotaExceededAdminError(): AppError {
  return new AppError({
    code: "RESOURCE_DOCUMENT_QUOTA_EXCEEDED",
    message: "Resource document quota exceeded",
    status: 422,
  })
}

export function resourceLibraryConflictAdminError(
  code:
    | "RESOURCE_DEPTH_LIMIT"
    | "RESOURCE_MOVE_CYCLE"
    | "RESOURCE_NAME_CONFLICT"
    | "RESOURCE_NODE_LIMIT"
    | "STALE_REVISION"
): AppError {
  return new AppError({
    code,
    message: "Resource library conflict",
    status:
      code === "RESOURCE_DEPTH_LIMIT" || code === "RESOURCE_NODE_LIMIT"
        ? 422
        : 409,
  })
}
