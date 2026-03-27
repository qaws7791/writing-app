
import { aiRequests } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

export type AIRequestRepository = {
  saveRequest: (input: {
    userId: string
    writingId?: number | null
    featureType: string
    inputText: string
    outputJson: string
    model: string
  }) => Promise<void>
}

export function createAIRequestRepository(db: DbClient): AIRequestRepository {
  return {
    async saveRequest(input) {
      await db
        .insert(aiRequests)
        .values({
          userId: input.userId,
          writingId: input.writingId ?? null,
          featureType: input.featureType,
          inputText: input.inputText,
          outputJson: input.outputJson,
          model: input.model,
          createdAt: new Date().toISOString(),
        })
        .run()
    },
  }
}
