import type { WritingDetail, HomeSnapshot } from "@/domain/writing"
import { createApiClient } from "@/foundation/api/client"
import { throwOnError } from "@/foundation/api/error"
import { env } from "@/foundation/config/env"
import { resolveBrowserApiBaseUrl } from "@/foundation/lib/api-base-url"
import {
  createMemoryStorage,
  getDefaultStorage,
  storageKeys,
  type StorageLike,
} from "@/foundation/lib/storage"

export type HomeRepository = {
  getHome: () => Promise<HomeSnapshot>
}

export type HomeRepositoryMode = "api" | "local"

function readWritings(storage: StorageLike): WritingDetail[] {
  const raw = storage.getItem(storageKeys.writings)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as WritingDetail[]
  } catch {
    return []
  }
}

function sortWritings(writings: WritingDetail[]): WritingDetail[] {
  return [...writings].sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return right.id - left.id
    }

    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

export function createLocalHomeRepository(
  storage: StorageLike = createMemoryStorage()
): HomeRepository {
  return {
    async getHome() {
      const writings = sortWritings(readWritings(storage))
      return {
        recentWritings: writings,
        resumeWriting: writings[0] ?? null,
        savedPrompts: [],
        todayPrompts: [],
      }
    },
  }
}

function createRemoteHomeRepository(apiBaseUrl: string): HomeRepository {
  const client = createApiClient({ baseUrl: apiBaseUrl })

  return {
    async getHome() {
      return throwOnError(await client.GET("/home"))
    },
  }
}

function resolveApiBaseUrl(explicitBaseUrl?: string): string | null {
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "")
  }

  const envBaseUrl = env.NEXT_PUBLIC_API_BASE_URL
  if (!envBaseUrl) {
    return null
  }

  return resolveBrowserApiBaseUrl(envBaseUrl)
}

function resolveMode(explicitMode?: HomeRepositoryMode): HomeRepositoryMode {
  return explicitMode ?? env.NEXT_PUBLIC_PHASE_ONE_MODE
}

export function createHomeRepository(options?: {
  apiBaseUrl?: string
  mode?: HomeRepositoryMode
  storage?: StorageLike
}): HomeRepository {
  const storage = options?.storage ?? getDefaultStorage()
  const mode = resolveMode(options?.mode)

  if (mode === "local") {
    return createLocalHomeRepository(storage)
  }

  const apiBaseUrl = resolveApiBaseUrl(options?.apiBaseUrl)
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in api mode.")
  }

  return createRemoteHomeRepository(apiBaseUrl)
}
