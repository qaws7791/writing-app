import { AppError } from "@workspace/http-platform/errors"

export function invalidAdminRequestError(): AppError {
  return new AppError({
    code: "INVALID_REQUEST",
    message: "Invalid request",
    status: 400,
  })
}

export function forbiddenAdminError(): AppError {
  return new AppError({
    code: "FORBIDDEN",
    message: "Forbidden",
    status: 403,
  })
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

export function resourceAssetStoreUnavailableAdminError(): AppError {
  return new AppError({
    code: "RESOURCE_ASSET_STORE_UNAVAILABLE",
    message: "Resource asset store unavailable",
    status: 503,
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
