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

function createHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new SyncTransportError(response.status, body)
  }
  return response.json() as Promise<T>
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

export function createSyncTransport(config: SyncTransportConfig) {
  const { baseUrl } = config

  return {
    async push(
      writingId: number,
      request: SyncPushRequest
    ): Promise<SyncPushResponse> {
      const response = await fetch(
        `${baseUrl}/writings/${writingId}/sync/push`,
        {
          method: "POST",
          headers: createHeaders(),
          credentials: "include",
          body: JSON.stringify(request),
        }
      )
      return handleResponse<SyncPushResponse>(response)
    },

    async pull(
      writingId: number,
      sinceVersion?: number
    ): Promise<SyncPullResponse> {
      const params = new URLSearchParams()
      if (sinceVersion !== undefined) {
        params.set("since", String(sinceVersion))
      }
      const query = params.toString()
      const url = `${baseUrl}/writings/${writingId}/sync/pull${query ? `?${query}` : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: createHeaders(),
        credentials: "include",
      })
      return handleResponse<SyncPullResponse>(response)
    },

    async listVersions(
      writingId: number,
      limit?: number
    ): Promise<{ items: VersionSummary[] }> {
      const params = new URLSearchParams()
      if (limit !== undefined) {
        params.set("limit", String(limit))
      }
      const query = params.toString()
      const url = `${baseUrl}/writings/${writingId}/versions${query ? `?${query}` : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: createHeaders(),
        credentials: "include",
      })
      return handleResponse<{ items: VersionSummary[] }>(response)
    },

    async getVersion(
      writingId: number,
      version: number
    ): Promise<VersionDetail> {
      const response = await fetch(
        `${baseUrl}/writings/${writingId}/versions/${version}`,
        {
          method: "GET",
          headers: createHeaders(),
          credentials: "include",
        }
      )
      return handleResponse<VersionDetail>(response)
    },
  }
}

export type SyncTransport = ReturnType<typeof createSyncTransport>
