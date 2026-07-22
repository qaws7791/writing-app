import { createInMemoryEventBus } from "@workspace/event-bus/in-memory-event-bus"
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

export function composeContentModule(input: {
  readonly database: WritingAppDatabase
  readonly environment: ContentRuntimeEnvironment
  readonly logger: AppLogger
  readonly now: () => Date
}): ContentModule {
  const eventBus = createInMemoryEventBus<WorkspaceEventMap>()

  return createContentModule({
    clock: { now: input.now },
    courseIdGenerator: {
      next: () => `course-${crypto.randomUUID()}` as CourseId,
    },
    database: input.database,
    eventFailureObserver(event) {
      input.logger.warn(event, "content.event.publish_failed")
    },
    eventIdGenerator: { next: () => crypto.randomUUID() },
    eventPublisher: {
      async publishCurriculumPublished(event) {
        const published = await eventBus.publish(event.type, event)
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
