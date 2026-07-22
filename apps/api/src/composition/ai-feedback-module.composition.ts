import type { Database } from "bun:sqlite"

import { createOpenAiClient } from "@workspace/ai/openai-client"
import type { AiFeedbackAttemptTransition } from "@workspace/ai-feedback/application"
import {
  createAiFeedbackModule,
  type AiFeedbackModule,
} from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import {
  createConfiguredAiFeedbackProvider,
  type OpenAiUsageEvent,
} from "@workspace/ai-feedback/provider"
import { runAiFeedbackSchemaMigration } from "@workspace/ai-feedback/schema"
import type { WritingAppDatabase } from "@workspace/db/client"

export function composeAiFeedbackModule(input: {
  readonly apiKey?: string
  readonly database: WritingAppDatabase
  readonly idGenerator?: () => string
  readonly model: string
  readonly now?: () => Date
  readonly onAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  readonly onUsage?: (event: OpenAiUsageEvent) => void
  readonly provider?: AiFeedbackProvider
  readonly sqlite: Database
}): AiFeedbackModule {
  runAiFeedbackSchemaMigration(input.sqlite)
  const now = input.now ?? (() => new Date())
  const provider =
    input.provider ??
    createConfiguredAiFeedbackProvider({
      model: input.model,
      onUsage: input.onUsage,
      runtime: createOpenAiClient({
        apiKey: input.apiKey,
        maxRetries: 0,
        timeoutMs: 30_000,
      }),
    })

  return createAiFeedbackModule({
    attemptIdGenerator: {
      next: input.idGenerator ?? (() => crypto.randomUUID()),
    },
    clock: { now },
    database: input.database,
    observeAttemptTransition: input.onAttemptTransition,
    provider,
  })
}
