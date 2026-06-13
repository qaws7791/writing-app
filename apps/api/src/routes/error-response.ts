export type ErrorCode =
  | "account_unavailable"
  | "invalid_request"
  | "not_found"
  | "unauthorized"

export type ErrorResponse = {
  readonly error: {
    readonly code: ErrorCode
  }
}

export function errorResponse(code: ErrorCode): ErrorResponse {
  return {
    error: {
      code,
    },
  }
}
