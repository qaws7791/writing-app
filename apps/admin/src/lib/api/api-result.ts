import {
  httpApiFailure,
  httpApiOk,
  type HttpApiResult,
} from "@workspace/http-client"

import type { AdminApiError } from "@/lib/api/api-error"

export type AdminApiResult<TValue> = HttpApiResult<TValue, AdminApiError>

export function adminApiOk<TValue>(value: TValue): AdminApiResult<TValue> {
  return httpApiOk(value)
}

export function adminApiError<TValue>(
  error: AdminApiError
): AdminApiResult<TValue> {
  return httpApiFailure(error)
}
