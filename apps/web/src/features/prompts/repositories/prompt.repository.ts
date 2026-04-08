import type { ApiClient } from "@workspace/api-client"

export async function fetchPromptCategories(client: ApiClient) {
  const { data, error } = await client.GET("/prompts/categories")
  if (error) throw error
  return data
}

export async function fetchPromptList(
  client: ApiClient,
  params?: {
    promptType?: "sensory" | "reflection" | "opinion"
    cursor?: number
    limit?: number
  }
) {
  const { data, error } = await client.GET("/prompts", {
    params: { query: params },
  })
  if (error) throw error
  return data
}
