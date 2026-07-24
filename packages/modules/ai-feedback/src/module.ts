import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdGenerator } from "@workspace/kernel/clock"

import {
  createAiFeedbackApplication,
  type AiFeedbackApplication,
  type AiFeedbackApplicationDependencies,
} from "#ai-feedback/application/ai-feedback-application"
import { createDrizzleAiFeedbackRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-drizzle-repository"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"
import {
  createAiFeedbackMaintenance,
  type AiFeedbackMaintenance,
} from "#ai-feedback/application/ai-feedback-maintenance"
import { createDrizzleAiFeedbackMaintenanceRepository } from "#ai-feedback/infrastructure/persistence/ai-feedback-maintenance-drizzle-repository"
export type AiFeedbackModule = Readonly<{
  application: AiFeedbackApplication
  maintenance: AiFeedbackMaintenance
}>

export function createAiFeedbackModule(
  input: Omit<
    AiFeedbackApplicationDependencies,
    "attemptIdGenerator" | "repository"
  > &
    Readonly<{
      attemptIdGenerator: IdGenerator<string>
      database: WritingAppDatabase
    }>
): AiFeedbackModule {
  const application = createAiFeedbackApplication({
    ...input,
    attemptIdGenerator: {
      next: () => createAiFeedbackAttemptId(input.attemptIdGenerator.next()),
    },
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
