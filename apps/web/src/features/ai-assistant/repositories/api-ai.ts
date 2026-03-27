import type {
  AIFeatureType,
  AISuggestion,
  ReviewItem,
} from "@workspace/core/modules/ai-assistant"

export type { AIFeatureType, AISuggestion, ReviewItem }
export type { ReviewItemType } from "@workspace/core/modules/ai-assistant"

import { env } from "@/foundation/config/env"

function getApiBaseUrl(): string {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required for AI features.")
  }
  return baseUrl.replace(/\/$/, "")
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(
      errorBody?.error?.message ?? `AI 요청 실패 (${response.status})`
    )
  }

  return response.json() as Promise<T>
}

export async function getAISuggestions(
  text: string,
  type: AIFeatureType
): Promise<AISuggestion[]> {
  const data = await postJson<{ suggestions: AISuggestion[] }>(
    "/ai/suggestions",
    { text, type }
  )
  return data.suggestions
}

export async function getDocumentReview(
  paragraphs: { from: number; to: number; text: string }[]
): Promise<ReviewItem[]> {
  const data = await postJson<{ items: ReviewItem[] }>("/ai/review/document", {
    paragraphs,
  })
  return data.items
}

export async function getFlowReview(
  paragraphs: { from: number; to: number; text: string }[]
): Promise<ReviewItem[]> {
  const data = await postJson<{ items: ReviewItem[] }>("/ai/review/flow", {
    paragraphs,
  })
  return data.items
}
