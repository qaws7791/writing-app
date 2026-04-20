import { createAiCoachingService, createAIModel } from "@workspace/ai"
import type { AiCoachingGateway } from "@workspace/core/modules/ai-feedback"

import { apiEnv } from "../config/env"

export function createAiCoachingGateway(): AiCoachingGateway {
  const project = apiEnv.GOOGLE_VERTEX_PROJECT
  if (!project) {
    throw new Error(
      "GOOGLE_VERTEX_PROJECT is required to use AI features. Set this environment variable."
    )
  }
  return createAiCoachingService(
    createAIModel("gemini-3.1-flash-lite-preview", {
      project,
      location: apiEnv.GOOGLE_VERTEX_LOCATION,
    })
  )
}
