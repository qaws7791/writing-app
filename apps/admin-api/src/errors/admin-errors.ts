import { AppError } from "@workspace/hono/errors"

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

export function notFoundAdminError(): AppError {
  return new AppError({
    code: "NOT_FOUND",
    message: "Not Found",
    status: 404,
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
