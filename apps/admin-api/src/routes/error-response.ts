export type AdminErrorCode =
  | "forbidden"
  | "internal_error"
  | "invalid_request"
  | "not_found"
  | "unauthorized"

export type AdminErrorDetailCode =
  | "invalid_body"
  | "malformed_json"
  | "unknown_body_read_error"

export type AdminErrorResponse = {
  readonly error: {
    readonly code: AdminErrorCode
    readonly detail?: {
      readonly code: AdminErrorDetailCode
    }
  }
}

export function errorResponse(
  code: AdminErrorCode,
  detail?: { readonly code: AdminErrorDetailCode }
): AdminErrorResponse {
  return {
    error: {
      code,
      ...(detail === undefined ? {} : { detail }),
    },
  }
}
