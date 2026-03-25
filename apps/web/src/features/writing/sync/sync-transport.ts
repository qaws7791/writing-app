import { createApiClient } from "@/foundation/api/client"

import type {
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  VersionDetail,
  VersionSummary,
} from "./types"

export type SyncTransportConfig = {
  baseUrl: string
}

export class SyncTransportError extends Error {
  constructor(
    readonly status: number,
    readonly body: string
  ) {
    super(`Sync transport error: ${status}`)
    this.name = "SyncTransportError"
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isNotFound(): boolean {
    return this.status === 404
  }
}

function throwTransportError(response: Response, errorBody?: unknown): never {
  const body =
    typeof errorBody === "object" && errorBody !== null
      ? JSON.stringify(errorBody)
      : ""
  throw new SyncTransportError(response.status, body)
}

function unwrapResult<T>(result: {
  data?: T
  error?: unknown
  response: Response
}): T {
  if (result.data !== undefined) {
    return result.data
  }
  throwTransportError(result.response, result.error)
}

export function createSyncTransport(config: SyncTransportConfig) {
  const client = createApiClient({ baseUrl: config.baseUrl })

  return {
    async push(
      writingId: number,
      request: SyncPushRequest
    ): Promise<SyncPushResponse> {
      const result = await client.POST("/writings/{writingId}/sync/push", {
        params: { path: { writingId } },
        body: request,
      })
      return unwrapResult(result)
    },

    async pull(
      writingId: number,
      sinceVersion?: number
    ): Promise<SyncPullResponse> {
      const result = await client.GET("/writings/{writingId}/sync/pull", {
        params: {
          path: { writingId },
          query: { since: sinceVersion },
        },
      })
      return unwrapResult(result)
    },

    async listVersions(
      writingId: number,
      limit?: number
    ): Promise<{ items: VersionSummary[] }> {
      const result = await client.GET("/writings/{writingId}/versions", {
        params: {
          path: { writingId },
          query: { limit },
        },
      })
      return unwrapResult(result)
    },

    async getVersion(
      writingId: number,
      version: number
    ): Promise<VersionDetail> {
      const result = await client.GET(
        "/writings/{writingId}/versions/{version}",
        {
          params: { path: { writingId, version } },
        }
      )
      return unwrapResult(result)
    },
  }
}

export type SyncTransport = ReturnType<typeof createSyncTransport>
