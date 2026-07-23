import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import type { AppLogger } from "@workspace/observability/logger"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import {
  createResourceLibraryModule,
  type ResourceLibraryModule,
} from "@workspace/resource-library/module"
import type {
  ResourceAdminSessionPort,
  ResourceObjectStoragePort,
} from "@workspace/resource-library/ports"
import {
  createS3ObjectStorage,
  type ObjectStorage,
} from "@workspace/storage/object-storage"
import type {
  ResourceAssetId,
  ResourceDocumentId,
  ResourceFolderId,
} from "@workspace/types/ids"

import { createResourceActorDirectory } from "@/adapters/auth/resource-actor-directory"
import type { AdminAssetStoreEnv } from "@/config/env"

export function composeResourceLibraryModule(input: {
  readonly assetIdGenerator: IdGenerator<ResourceAssetId>
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly documentIdGenerator: IdGenerator<ResourceDocumentId>
  readonly folderIdGenerator: IdGenerator<ResourceFolderId>
  readonly logger: AppLogger
  readonly storage: ResourceObjectStoragePort | null
}): ResourceLibraryModule {
  return createResourceLibraryModule({
    actorDirectory: createResourceActorDirectory(input.database),
    assetAuditObserver(event) {
      input.logger.error(event, `admin.${event.kind}`)
    },
    assetIdGenerator: input.assetIdGenerator,
    clock: input.clock,
    database: input.database,
    documentIdGenerator: input.documentIdGenerator,
    folderIdGenerator: input.folderIdGenerator,
    storage: input.storage,
  })
}

export function createResourceAdminSessionPort(
  sessionResolver: AdminSessionResolver
): ResourceAdminSessionPort {
  return Object.freeze({
    async resolveActor(headers) {
      const session = await sessionResolver.resolveSession(headers)
      return session === null
        ? null
        : Object.freeze({
            access: "allowed" as const,
            email: session.admin.email,
            id: session.admin.id,
            name: session.admin.name,
          })
    },
  })
}

export function createResourceObjectStorage(
  config: AdminAssetStoreEnv | undefined
): ResourceObjectStoragePort | null {
  if (config === undefined) return null
  const result = createS3ObjectStorage(config)
  if (result.isErr()) throw result.error
  return createResourceObjectStoragePort(result.value)
}

export function createResourceObjectStoragePort(
  storage: ObjectStorage
): ResourceObjectStoragePort {
  return Object.freeze({
    async deleteObjects(objectKeys) {
      const deleted = await storage.deleteObjects(objectKeys)
      return deleted.mapErr((error) => ({ retryable: error.retryable }))
    },
    async putObject(input) {
      const uploaded = await storage.putObject(input)
      return uploaded.mapErr((error) => ({ retryable: error.retryable }))
    },
  })
}
