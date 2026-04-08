import { createApiClient } from "@workspace/api-client"

import { env } from "@/foundation/config/env"

export const apiClient = createApiClient({
  baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
})
