export type ErrorCode =
  | "account_unavailable"
  | "attempt_limit_exceeded"
  | "internal_server_error"
  | "invalid_request"
  | "not_found"
  | "provider_unavailable"
  | "unauthorized"

export type ErrorDetailCode =
  | "invalid_body"
  | "malformed_json"
  | "unknown_body_read_error"

export type ErrorResponse = {
  readonly error: {
    readonly code: ErrorCode
    readonly detail?: {
      readonly code: ErrorDetailCode
    }
  }
}

export function errorResponse(
  code: ErrorCode,
  detail?: { readonly code: ErrorDetailCode }
): ErrorResponse {
  return {
    error: {
      code,
      ...(detail === undefined ? {} : { detail }),
    },
  }
}
