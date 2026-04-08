import type { ApiClient } from "@workspace/api-client"

export async function fetchUserProfile(client: ApiClient) {
  const { data, error } = await client.GET("/users/profile")
  if (error) throw error
  return data
}
