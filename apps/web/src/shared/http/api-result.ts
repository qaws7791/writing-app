import type { HttpApiResult } from "@workspace/http-client"

import type { ApiError } from "@/shared/http/api-error"

export type ApiResult<TValue> = HttpApiResult<TValue, ApiError>
