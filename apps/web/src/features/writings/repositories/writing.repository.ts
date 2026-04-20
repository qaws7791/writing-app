import type { ApiClient } from "@workspace/api-client"

import {
  unwrapApiResult,
  unwrapRequiredApiResult,
} from "@/foundation/api/result"

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
  return unwrapRequiredApiResult(
    await client.POST("/writings", {
      body: input,
    }),
    "글 생성 응답이 비어 있습니다."
  )
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
  return unwrapRequiredApiResult(
    await client.PATCH("/writings/{writingId}", {
      params: { path: { writingId } },
      body: input,
    }),
    "글 저장 응답이 비어 있습니다."
  )
}

export async function fetchWritingDetail(client: ApiClient, writingId: number) {
  return unwrapRequiredApiResult(
    await client.GET("/writings/{writingId}", {
      params: { path: { writingId } },
    }),
    "글 상세 응답이 비어 있습니다."
  )
}

export async function deleteWriting(client: ApiClient, writingId: number) {
  unwrapApiResult(
    await client.DELETE("/writings/{writingId}", {
      params: { path: { writingId } },
    })
  )
}

export async function fetchWritings(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {}
) {
  return unwrapRequiredApiResult(
    await client.GET("/writings", {
      params: { query: params },
    }),
    "글 목록 응답이 비어 있습니다."
  )
}
