import { AppError } from "@workspace/hono/errors"
import type { AdminOwnerMutationResult } from "@workspace/core/admin"

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

export function resourceCollaborationUnavailableAdminError(): AppError {
  return new AppError({
    code: "RESOURCE_COLLABORATION_UNAVAILABLE",
    message: "Resource collaboration unavailable",
    status: 503,
  })
}

export function resourceDocumentProjectionTimeoutAdminError(): AppError {
  return new AppError({
    code: "RESOURCE_DOCUMENT_PROJECTION_TIMEOUT",
    message: "Resource document projection timeout",
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
    | "RESOURCE_MOVE_CYCLE"
    | "RESOURCE_NAME_CONFLICT"
    | "RESOURCE_POSITION_CONFLICT"
    | "STALE_REVISION"
): AppError {
  return new AppError({
    code,
    message: "Resource library conflict",
    status: 409,
  })
}
