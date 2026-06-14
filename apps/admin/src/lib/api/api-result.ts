import type { AdminApiError } from "@/lib/api/api-error"

export type AdminApiResult<TValue> =
  | {
      readonly status: "ok"
      readonly value: TValue
    }
  | {
      readonly error: AdminApiError
      readonly status: "error"
    }

export function adminApiOk<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

export function adminApiError<TValue>(
  error: AdminApiError
): AdminApiResult<TValue> {
  return {
    error,
    status: "error",
  }
}
