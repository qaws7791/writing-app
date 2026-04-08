import type { ApiClient } from "@workspace/api-client"

export async function fetchHomeSnapshot(client: ApiClient) {
  const { data, error } = await client.GET("/home")
  if (error) throw error
  return data
}
