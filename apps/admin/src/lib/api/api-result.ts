import type { HttpApiResult } from "@workspace/http-client"

import type { AdminApiError } from "@/lib/api/api-error"

export type AdminApiResult<TValue> = HttpApiResult<TValue, AdminApiError>
