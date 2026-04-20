import type { ApiClient } from "@workspace/api-client"

import { unwrapRequiredApiResult } from "@/foundation/api/result"

export async function generateTextFeedback(
  client: ApiClient,
  input: {
    text: string
    level?: "beginner" | "intermediate" | "advanced"
  }
) {
  return unwrapRequiredApiResult(
    await client.POST("/ai/feedback", {
      body: input,
    }),
    "AI 피드백 응답이 비어 있습니다."
  )
}

export async function compareTexts(
  client: ApiClient,
  input: {
    originalText: string
    revisedText: string
  }
) {
  return unwrapRequiredApiResult(
    await client.POST("/ai/compare", {
      body: input,
    }),
    "AI 비교 응답이 비어 있습니다."
  )
}
