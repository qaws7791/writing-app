import type { LanguageModel } from "ai"
import { google } from "@ai-sdk/google"

export function createAIModel(): LanguageModel {
  return google("gemini-3.1-flash-lite-preview")
}
