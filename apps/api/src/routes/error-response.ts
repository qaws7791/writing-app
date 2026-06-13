export type ErrorCode =
  | "account_unavailable"
  | "attempt_limit_exceeded"
  | "invalid_request"
  | "not_found"
  | "provider_unavailable"
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
