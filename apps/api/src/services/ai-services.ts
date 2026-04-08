import { createAiCoachingService, createAIModel } from "@workspace/ai"
import type { AiCoachingGateway } from "@workspace/core"

import { apiEnv } from "../config/env"

export function createAiCoachingGateway(): AiCoachingGateway {
  return createAiCoachingService(
    createAIModel("gemini-3.1-flash-lite-preview", {
      project: apiEnv.GOOGLE_VERTEX_PROJECT,
      location: apiEnv.GOOGLE_VERTEX_LOCATION,
    })
  )
}
