import type { Database } from "bun:sqlite"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { InMemoryEventBus } from "@workspace/event-bus/in-memory-event-bus"
import type { WorkspaceEventMap } from "@workspace/event-contracts/workspace-event"
import {
  createIdentityModule,
  type IdentityModule,
} from "@workspace/identity/module"
import type { IdentityLearningReportPort } from "@workspace/identity/ports"
import type { AppLogger } from "@workspace/observability/logger"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { createLearnerIdentityDirectory } from "@/adapters/auth/learner-identity-directory"
import { runApiIdentitySchemaMigration } from "@/composition/identity-schema-migration"

export function composeIdentityModule(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly eventBus: InMemoryEventBus<WorkspaceEventMap>
  readonly eventIdGenerator: IdGenerator<string>
  readonly logger: AppLogger
  readonly learningReport: IdentityLearningReportPort
  readonly sqlite: Database
}): IdentityModule {
  runApiIdentitySchemaMigration(input.sqlite)

  return createIdentityModule({
    clock: input.clock,
    database: input.database,
    eventFailureObserver(event) {
      input.logger.warn(event, "identity.event.publish_failed")
    },
    eventIdGenerator: input.eventIdGenerator,
    eventPublisher: {
      async publishUserStatusChanged(event) {
        const published = await input.eventBus.publish(event.type, event)
        return published.mapErr(() => ({
          kind: "identity-event-publish-failed" as const,
        }))
      },
    },
    learningReport: input.learningReport,
    learnerIdentityDirectory: createLearnerIdentityDirectory(input.database),
    sessionRevocation: createIdentitySessionRevocation(input.database),
  })
}
