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
  createAiFeedbackRoutes,
  type AiFeedbackHttpCommandPort,
  type AiFeedbackLearnerSessionPort,
} from "#ai-feedback/interface/http/ai-feedback-routes"

export type AiFeedbackModule = Readonly<{
  application: AiFeedbackApplication
  createLearnerRoutes: (input: {
    readonly command: AiFeedbackHttpCommandPort
    readonly session: AiFeedbackLearnerSessionPort
  }) => ReturnType<typeof createAiFeedbackRoutes>
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

  return Object.freeze({
    application,
    createLearnerRoutes(routeInput) {
      return createAiFeedbackRoutes(routeInput)
    },
  })
}
