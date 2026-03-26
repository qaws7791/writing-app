import { createSyncTransport } from "@/features/writing/sync/sync-transport"
import type {
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  VersionDetail,
  VersionSummary,
} from "@/features/writing/sync/types"
import { env } from "@/foundation/config/env"
import { resolveBrowserApiBaseUrl } from "@/foundation/lib/api-base-url"

export type VersionDataSource = {
  getVersion: (writingId: number, version: number) => Promise<VersionDetail>
  listVersions: (
    writingId: number,
    limit?: number
  ) => Promise<{ items: VersionSummary[] }>
  pull: (writingId: number, sinceVersion?: number) => Promise<SyncPullResponse>
  push: (
    writingId: number,
    request: SyncPushRequest
  ) => Promise<SyncPushResponse>
}

export function createVersionDataSource(): VersionDataSource {
  const apiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is required for version operations."
    )
  }

  const transport = createSyncTransport({
    baseUrl: resolveBrowserApiBaseUrl(apiBaseUrl),
  })

  return {
    getVersion: (writingId, version) =>
      transport.getVersion(writingId, version),
    listVersions: (writingId, limit) =>
      transport.listVersions(writingId, limit),
    pull: (writingId, sinceVersion) => transport.pull(writingId, sinceVersion),
    push: (writingId, request) => transport.push(writingId, request),
  }
}
