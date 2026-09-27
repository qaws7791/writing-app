import {
  createContentModule,
  type ContentModule,
} from "@workspace/content/module"
import type {
  ContentAssetStoragePort,
  ContentAssetImageProcessorPort,
} from "@workspace/content/ports"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { ContentAssetId, CourseId } from "@workspace/types/ids"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeContentModule(input: {
  readonly assetIdGenerator: IdGenerator<ContentAssetId>
  readonly assetStorage: ContentAssetStoragePort
  readonly imageProcessor: ContentAssetImageProcessorPort
  readonly clock: Clock
  readonly courseIdGenerator: IdGenerator<CourseId>
  readonly database: WritingAppDatabase
}): ContentModule {
  return createContentModule({
    assetIdGenerator: input.assetIdGenerator,
    assetImageProcessor: input.imageProcessor,
    assetStorage: input.assetStorage,
    clock: input.clock,
    courseIdGenerator: input.courseIdGenerator,
    database: input.database,
  })
}
