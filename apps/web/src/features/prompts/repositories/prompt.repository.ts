import type { ApiClient } from "@workspace/api-client"

type PromptWritingsData = {
  items: readonly {
    id: number
    title: string
    preview: string
    wordCount: number
    createdAt: string
    isOwner: boolean
  }[]
  nextCursor: string | null
  hasMore: boolean
}

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

export async function fetchPromptDetail(client: ApiClient, promptId: number) {
  const { data, error } = await client.GET("/prompts/{promptId}", {
    params: { path: { promptId } },
  })
  if (error) throw error
  return data
}

export async function fetchPromptWritings(
  client: ApiClient,
  promptId: number,
  params?: { cursor?: string; limit?: number }
): Promise<PromptWritingsData> {
  const { data, error } = await client.GET("/prompts/{promptId}/writings", {
    params: { path: { promptId }, query: params },
  })
  if (error) throw error
  return data as unknown as PromptWritingsData
}
