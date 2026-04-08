import type { LanguageModel } from "ai"
import {
  createVertex,
  type GoogleVertexProviderSettings,
} from "@ai-sdk/google-vertex"

export function createAIModel(
  modelId: string,
  options?: GoogleVertexProviderSettings | undefined
): LanguageModel {
  const vertex = createVertex(options)

  return vertex(modelId)
}
