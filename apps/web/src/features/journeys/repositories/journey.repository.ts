import type { ApiClient } from "@workspace/api-client"

export async function fetchJourneyList(
  client: ApiClient,
  params?: {
    category?: "writing_skill" | "mindfulness" | "practical"
  }
) {
  const { data, error } = await client.GET("/journeys", {
    params: { query: params },
  })
  if (error) throw error
  return data
}

export async function fetchJourneyDetail(client: ApiClient, journeyId: number) {
  const { data, error } = await client.GET("/journeys/{journeyId}", {
    params: { path: { journeyId } },
  })
  if (error) throw error
  return data
}

export async function enrollJourney(client: ApiClient, journeyId: number) {
  const { data, error } = await client.POST("/journeys/{journeyId}/enroll", {
    params: { path: { journeyId } },
  })
  if (error) throw error
  return data
}
