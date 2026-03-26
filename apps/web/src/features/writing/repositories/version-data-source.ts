import { createApiClient } from "@/foundation/api/client"
import { createSyncTransport } from "@/features/writing/sync/sync-transport"
import type {
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  VersionDetail,
  VersionSummary,
} from "@/features/writing/sync/types"

export type VersionDataSource = {
  getVersion: (writingId: number, version: number) => Promise<VersionDetail>
  listVersions: (
    writingId: number,
    params?: { cursor?: string; limit?: number }
  ) => Promise<{
    items: VersionSummary[]
    nextCursor: string | null
    hasMore: boolean
  }>
  pull: (writingId: number, sinceVersion?: number) => Promise<SyncPullResponse>
  push: (
    writingId: number,
    request: SyncPushRequest
  ) => Promise<SyncPushResponse>
}

export function createVersionDataSource(): VersionDataSource {
  const transport = createSyncTransport({
    client: createApiClient(),
  })

  return {
    getVersion: (writingId, version) =>
      transport.getVersion(writingId, version),
    listVersions: (writingId, params) =>
      transport.listVersions(writingId, params),
    pull: (writingId, sinceVersion) => transport.pull(writingId, sinceVersion),
    push: (writingId, request) => transport.push(writingId, request),
  }
}
