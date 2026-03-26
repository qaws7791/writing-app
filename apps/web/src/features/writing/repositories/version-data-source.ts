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
  getVersion: (draftId: number, version: number) => Promise<VersionDetail>
  listVersions: (
    draftId: number,
    limit?: number
  ) => Promise<{ items: VersionSummary[] }>
  pull: (draftId: number, sinceVersion?: number) => Promise<SyncPullResponse>
  push: (draftId: number, request: SyncPushRequest) => Promise<SyncPushResponse>
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
    getVersion: (draftId, version) => transport.getVersion(draftId, version),
    listVersions: (draftId, limit) => transport.listVersions(draftId, limit),
    pull: (draftId, sinceVersion) => transport.pull(draftId, sinceVersion),
    push: (draftId, request) => transport.push(draftId, request),
  }
}
