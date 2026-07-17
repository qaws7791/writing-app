import type { HttpApiResult } from "@workspace/http-client"

import type { ApiError } from "@/lib/api/api-error"

export type ApiResult<TValue> = HttpApiResult<TValue, ApiError>
