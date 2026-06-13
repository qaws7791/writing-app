import type { ApiError } from "@/lib/api/api-error"

export type ApiOk<TValue> = {
  readonly status: "ok"
  readonly value: TValue
}

export type ApiFailure = {
  readonly error: ApiError
  readonly status: "error"
}

export type ApiResult<TValue> = ApiOk<TValue> | ApiFailure

export function apiOk<TValue>(value: TValue): ApiOk<TValue> {
  return {
    status: "ok",
    value,
  }
}

export function apiFailure(error: ApiError): ApiFailure {
  return {
    error,
    status: "error",
  }
}
