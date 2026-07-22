import type { Database } from "bun:sqlite"
import type { WritingAppDatabase } from "@workspace/db/client"
import { createInMemoryEventBus } from "@workspace/event-bus/in-memory-event-bus"
import type { WorkspaceEventMap } from "@workspace/event-contracts/workspace-event"
import {
  createIdentityModule,
  type IdentityModule,
} from "@workspace/identity/module"
import type { AppLogger } from "@workspace/observability/logger"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"
import { createIdentityLearningReport } from "@/adapters/learning/identity-learning-report"
import { runApiIdentitySchemaMigration } from "@/composition/identity-schema-migration"

export function composeIdentityModule(input: {
  readonly database: WritingAppDatabase
  readonly logger: AppLogger
  readonly now: () => Date
  readonly sqlite: Database
}): IdentityModule {
  runApiIdentitySchemaMigration(input.sqlite)
  const eventBus = createInMemoryEventBus<WorkspaceEventMap>()

  return createIdentityModule({
    clock: { now: input.now },
    database: input.database,
    eventFailureObserver(event) {
      input.logger.warn(event, "identity.event.publish_failed")
    },
    eventIdGenerator: { next: () => crypto.randomUUID() },
    eventPublisher: {
      async publishUserStatusChanged(event) {
        const published = await eventBus.publish(event.type, event)
        return published.mapErr(() => ({
          kind: "identity-event-publish-failed" as const,
        }))
      },
    },
    learningReport: createIdentityLearningReport(input.database),
    learnerIdentityDirectory: createLearnerIdentityDirectory(input.database),
    sessionRevocation: createIdentitySessionRevocation(input.database),
  })
}
