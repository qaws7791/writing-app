export type AdminErrorCode =
  | "internal_error"
  | "invalid_request"
  | "not_found"
  | "unauthorized"

export type AdminErrorResponse = {
  readonly error: {
    readonly code: AdminErrorCode
  }
}

export function errorResponse(code: AdminErrorCode): AdminErrorResponse {
  return {
    error: {
      code,
    },
  }
}
