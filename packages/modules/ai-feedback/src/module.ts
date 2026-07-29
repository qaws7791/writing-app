import { createOpenAiClient } from "@workspace/ai/openai-client"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdGenerator } from "@workspace/kernel/clock"

import {
  createAiFeedbackApplication,
  type AiFeedbackApplication,
  type AiFeedbackApplicationDependencies,
} from "#ai-feedback/application/ai-feedback-application"
import { createDrizzleAiFeedbackRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-drizzle-repository"
import {
  createAiFeedbackAttemptId,
  defaultAiFeedbackAttemptPolicy,
} from "#ai-feedback/domain/ai-feedback-attempt"
import {
  createAiFeedbackMaintenance,
  type AiFeedbackMaintenance,
} from "#ai-feedback/application/ai-feedback-maintenance"
import type { AiFeedbackProvider } from "#ai-feedback/application/ports/ai-feedback-provider"
import { createConfiguredAiFeedbackProvider } from "#ai-feedback/infrastructure/adapters/openai-feedback-provider"
import { createDrizzleAiFeedbackMaintenanceRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-maintenance-drizzle-repository"

export type AiFeedbackModule = Readonly<{
  application: AiFeedbackApplication
  maintenance: AiFeedbackMaintenance
}>

export function createAiFeedbackModule(
  input: Omit<
    AiFeedbackApplicationDependencies,
    "attemptIdGenerator" | "provider" | "repository"
  > &
    Readonly<{
      attemptIdGenerator: IdGenerator<string>
      database: WritingAppDatabase
      openAi: Readonly<{
        apiKey: string | undefined
        model: string
      }>
      /** 주입하면 설정 기반 provider를 대체한다. 테스트와 E2E가 사용한다. */
      provider?: AiFeedbackProvider
    }>
): AiFeedbackModule {
  const application = createAiFeedbackApplication({
    ...input,
    attemptIdGenerator: {
      next: () => createAiFeedbackAttemptId(input.attemptIdGenerator.next()),
    },
    provider:
      input.provider ??
      createConfiguredAiFeedbackProvider({
        model: input.openAi.model,
        runtime: createOpenAiClient({
          apiKey: input.openAi.apiKey,
          maxRetries: 0,
          timeoutMs: (input.attemptPolicy ?? defaultAiFeedbackAttemptPolicy)
            .providerTimeoutMs,
        }),
      }),
    repository: createDrizzleAiFeedbackRepository(input.database),
  })

  return {
    application,
    maintenance: createAiFeedbackMaintenance({
      clock: input.clock,
      repository: createDrizzleAiFeedbackMaintenanceRepository(input.database),
    }),
  }
}

export { aiFeedbackLearnerDataPurge } from "#ai-feedback/infrastructure/persistence/learner-purge"
