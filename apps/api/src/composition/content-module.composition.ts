import type { InMemoryEventBus } from "@workspace/event-bus/in-memory-event-bus"
import type { WorkspaceEventMap } from "@workspace/event-contracts/workspace-event"
import {
  authorizeContentReset,
  type ContentRuntimeEnvironment,
} from "@workspace/content/application"
import {
  createContentModule,
  type ContentModule,
} from "@workspace/content/module"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { AppLogger } from "@workspace/observability/logger"
import type { CourseId } from "@workspace/types/ids"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeContentModule(input: {
  readonly clock: Clock
  readonly courseIdGenerator: IdGenerator<CourseId>
  readonly database: WritingAppDatabase
  readonly environment: ContentRuntimeEnvironment
  readonly eventBus: InMemoryEventBus<WorkspaceEventMap>
  readonly eventIdGenerator: IdGenerator<string>
  readonly logger: AppLogger
}): ContentModule {
  return createContentModule({
    clock: input.clock,
    courseIdGenerator: input.courseIdGenerator,
    database: input.database,
    eventFailureObserver(event) {
      input.logger.warn(event, "content.event.publish_failed")
    },
    eventIdGenerator: input.eventIdGenerator,
    eventPublisher: {
      async publishCurriculumPublished(event) {
        const published = await input.eventBus.publish(event.type, event)
        return published.mapErr(() => ({
          kind: "content-event-publish-failed" as const,
        }))
      },
    },
    resetGuard: {
      authorize() {
        return authorizeContentReset({
          confirmed: true,
          environment: input.environment,
        })
      },
    },
  })
}
