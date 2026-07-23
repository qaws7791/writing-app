import {
  authorizeContentReset,
  type ContentRuntimeEnvironment,
} from "@workspace/content/application"
import {
  createContentModule,
  type ContentModule,
} from "@workspace/content/module"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { CourseId } from "@workspace/types/ids"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeContentModule(input: {
  readonly clock: Clock
  readonly courseIdGenerator: IdGenerator<CourseId>
  readonly database: WritingAppDatabase
  readonly environment: ContentRuntimeEnvironment
}): ContentModule {
  return createContentModule({
    clock: input.clock,
    courseIdGenerator: input.courseIdGenerator,
    database: input.database,
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
