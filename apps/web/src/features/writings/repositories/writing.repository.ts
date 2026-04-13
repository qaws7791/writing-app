import type { ApiClient } from "@workspace/api-client"

export async function createWriting(
  client: ApiClient,
  input: {
    title?: string
    bodyJson?: unknown
    bodyPlainText?: string
    wordCount?: number
    sourcePromptId?: number
  }
) {
  const { data, error } = await client.POST("/writings", {
    body: input,
  })
  if (error) throw error
  return data
}

export async function saveWriting(
  client: ApiClient,
  writingId: number,
  input: {
    title?: string
    bodyJson?: unknown
    bodyPlainText?: string
    wordCount?: number
  }
) {
  const { data, error } = await client.PATCH("/writings/{writingId}", {
    params: { path: { writingId } },
    body: input,
  })
  if (error) throw error
  return data
}

export async function fetchWritingDetail(client: ApiClient, writingId: number) {
  const { data, error } = await client.GET("/writings/{writingId}", {
    params: { path: { writingId } },
  })
  if (error) throw error
  return data
}

export async function deleteWriting(client: ApiClient, writingId: number) {
  const { error } = await client.DELETE("/writings/{writingId}", {
    params: { path: { writingId } },
  })
  if (error) throw error
}

export async function fetchWritings(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {}
) {
  const { data, error } = await client.GET("/writings", {
    params: { query: params },
  })
  if (error) throw error
  return data
}
