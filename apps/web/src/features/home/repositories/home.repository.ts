import type { ApiClient } from "@workspace/api-client"

import { unwrapRequiredApiResult } from "@/foundation/api/result"

export async function fetchHomeSnapshot(client: ApiClient) {
  return unwrapRequiredApiResult(
    await client.GET("/home"),
    "홈 스냅샷 응답이 비어 있습니다."
  )
}
