import type { ApiClient } from "@workspace/api-client"

import { unwrapRequiredApiResult } from "@/foundation/api/result"

export async function fetchUserProfile(client: ApiClient) {
  return unwrapRequiredApiResult(
    await client.GET("/users/profile"),
    "사용자 프로필 응답이 비어 있습니다."
  )
}
