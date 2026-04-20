import type { ApiClient } from "@workspace/api-client"

import { unwrapRequiredApiResult } from "@/foundation/api/result"

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
  return unwrapRequiredApiResult(
    await client.GET("/prompts/categories"),
    "글감 카테고리 응답이 비어 있습니다."
  )
}

export async function fetchPromptList(
  client: ApiClient,
  params?: {
    promptType?: "sensory" | "reflection" | "opinion"
    cursor?: number
    limit?: number
  }
) {
  return unwrapRequiredApiResult(
    await client.GET("/prompts", {
      params: { query: params },
    }),
    "글감 목록 응답이 비어 있습니다."
  )
}

export async function fetchPromptDetail(client: ApiClient, promptId: number) {
  return unwrapRequiredApiResult(
    await client.GET("/prompts/{promptId}", {
      params: { path: { promptId } },
    }),
    "글감 상세 응답이 비어 있습니다."
  )
}

export async function fetchPromptWritings(
  client: ApiClient,
  promptId: number,
  params?: { cursor?: string; limit?: number }
): Promise<PromptWritingsData> {
  return unwrapRequiredApiResult(
    await client.GET("/prompts/{promptId}/writings", {
      params: { path: { promptId }, query: params },
    }),
    "글감별 글 목록 응답이 비어 있습니다."
  ) as PromptWritingsData
}
