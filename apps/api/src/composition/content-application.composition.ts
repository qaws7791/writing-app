import {
  createContentApplication,
  type ContentApplication,
} from "@workspace/content/application"
import type { ContentAssetStoragePort } from "@workspace/content/ports"
import type { WritingAppDatabase } from "@workspace/db/client"
import { createS3ObjectStorage } from "@workspace/storage/object-storage"
import type { ContentAssetId, CourseId } from "@workspace/types/ids"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

import { createContentAssetStorageAdapter } from "@/adapters/content/content-asset-storage"
import { createSharpContentAssetImageProcessor } from "@/adapters/content/sharp-content-asset-image-processor"
import type { AdminAssetStoreEnv } from "@/config/env"

export function composeContentApplication(input: {
  readonly assetIdGenerator: IdGenerator<ContentAssetId>
  readonly assetStorage?: ContentAssetStoragePort
  readonly assetStore: AdminAssetStoreEnv | undefined
  readonly clock: Clock
  readonly courseIdGenerator: IdGenerator<CourseId>
  readonly database: WritingAppDatabase
}): ContentApplication {
  const objectStorage =
    input.assetStorage ??
    (input.assetStore === undefined
      ? null
      : createS3ObjectStorage(input.assetStore).match(
          (storage) => createContentAssetStorageAdapter(storage),
          (error) => {
            throw new Error("콘텐츠 이미지 저장소 설정이 유효하지 않습니다.", {
              cause: error,
            })
          }
        ))

  return createContentApplication({
    assetIdGenerator: input.assetIdGenerator,
    assetImageProcessor: createSharpContentAssetImageProcessor(),
    assetStorage: objectStorage,
    clock: input.clock,
    courseIdGenerator: input.courseIdGenerator,
    database: input.database,
  })
}
