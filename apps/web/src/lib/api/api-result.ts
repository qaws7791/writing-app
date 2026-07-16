import {
  type HttpApiFailure,
  type HttpApiOk,
  type HttpApiResult,
} from "@workspace/http-client"

import type { ApiError } from "@/lib/api/api-error"

export type ApiOk<TValue> = HttpApiOk<TValue>

export type ApiFailure = HttpApiFailure<ApiError>

export type ApiResult<TValue> = HttpApiResult<TValue, ApiError>
