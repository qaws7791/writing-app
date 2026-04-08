import type { LanguageModel } from "ai"
import {
  createVertex,
  GoogleVertexProviderSettings,
} from "@ai-sdk/google-vertex"

export function createAIModel(
  options?: GoogleVertexProviderSettings | undefined
): LanguageModel {
  const vertex = createVertex(options)

  return vertex("gemini-3.1-flash-lite-preview")
}
