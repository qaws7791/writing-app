import type { WritingDetail, HomeSnapshot } from "@/domain/writing"
import { writingDetailsJsonCodec } from "@/domain/writing"
import { createApiClient, type ApiClient } from "@/foundation/api/client"
import { throwOnError } from "@/foundation/api/error"
import { env } from "@/foundation/config/env"
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
    return writingDetailsJsonCodec.decode(raw)
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

function createRemoteHomeRepository(client: ApiClient): HomeRepository {
  return {
    async getHome() {
      return throwOnError(await client.GET("/home"))
    },
  }
}

function resolveMode(explicitMode?: HomeRepositoryMode): HomeRepositoryMode {
  return explicitMode ?? env.NEXT_PUBLIC_PHASE_ONE_MODE
}

export function createHomeRepository(options?: {
  client?: ApiClient
  mode?: HomeRepositoryMode
  storage?: StorageLike
}): HomeRepository {
  const storage = options?.storage ?? getDefaultStorage()
  const mode = resolveMode(options?.mode)

  if (mode === "local") {
    return createLocalHomeRepository(storage)
  }

  return createRemoteHomeRepository(options?.client ?? createApiClient())
}
