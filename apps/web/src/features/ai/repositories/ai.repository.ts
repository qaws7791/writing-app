import type { ApiClient } from "@workspace/api-client"

export async function generateTextFeedback(
  client: ApiClient,
  input: {
    text: string
    level?: "beginner" | "intermediate" | "advanced"
  }
) {
  const { data, error } = await client.POST("/ai/feedback", {
    body: input,
  })
  if (error) throw error
  return data
}

export async function compareTexts(
  client: ApiClient,
  input: {
    originalText: string
    revisedText: string
  }
) {
  const { data, error } = await client.POST("/ai/compare", {
    body: input,
  })
  if (error) throw error
  return data
}
