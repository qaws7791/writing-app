export type ErrorCode = "account_unavailable" | "unauthorized"

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
