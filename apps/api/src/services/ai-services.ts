import { createAiCoachingService, createAIModel } from "@workspace/ai"
import type { AiCoachingGateway } from "@workspace/core"

export function createAiCoachingGateway(): AiCoachingGateway {
  return createAiCoachingService(createAIModel())
}
