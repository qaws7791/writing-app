import type { ApiClient } from "@workspace/api-client"

import { unwrapRequiredApiResult } from "@/foundation/api/result"

export async function fetchJourneyList(
  client: ApiClient,
  params?: {
    category?: "writing_skill" | "mindfulness" | "practical"
    status?: "all" | "in_progress" | "completed"
  }
) {
  return unwrapRequiredApiResult(
    await client.GET("/journeys", {
      params: { query: params },
    }),
    "여정 목록 응답이 비어 있습니다."
  )
}

export async function fetchJourneyDetail(client: ApiClient, journeyId: number) {
  return unwrapRequiredApiResult(
    await client.GET("/journeys/{journeyId}", {
      params: { path: { journeyId } },
    }),
    "여정 상세 응답이 비어 있습니다."
  )
}

export async function enrollJourney(client: ApiClient, journeyId: number) {
  return unwrapRequiredApiResult(
    await client.POST("/journeys/{journeyId}/enroll", {
      params: { path: { journeyId } },
    }),
    "여정 등록 응답이 비어 있습니다."
  )
}
