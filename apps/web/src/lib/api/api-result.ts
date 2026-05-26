import type { ApiError } from "@/lib/api/api-error"

export type ApiResult<TValue> =
  | {
      status: "ok"
      value: TValue
    }
  | {
      status: "error"
      error: ApiError
    }

export function apiOk<TValue>(value: TValue): ApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

export function apiFailure<TValue = never>(error: ApiError): ApiResult<TValue> {
  return {
    status: "error",
    error,
  }
}
