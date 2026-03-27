import { z } from "zod"
import type { WritingDetail } from "@/domain/writing"
import type {
  PromptDetail,
  PromptFilters,
  PromptSummary,
} from "@/domain/prompt"
import { createApiClient, type ApiClient } from "@/foundation/api/client"
import { createApiError, throwOnError } from "@/foundation/api/error"
import { env } from "@/foundation/config/env"
import { jsonCodec } from "@/foundation/lib/zod"
import {
  createMemoryStorage,
  getDefaultStorage,
  storageKeys,
  type StorageLike,
} from "@/foundation/lib/storage"
import type { CreateWritingInput } from "@/features/writing/repositories/writing-repository"

type SavedPromptEntry = {
  promptId: number
  savedAt: string
}

const savedPromptEntrySchema = z.object({
  promptId: z.number().int(),
  savedAt: z.string(),
})

const savedPromptEntriesSchema = z.array(savedPromptEntrySchema)

const savedPromptEntriesJsonCodec = jsonCodec(savedPromptEntriesSchema)

export type PromptRepository = {
  createWriting: (input: CreateWritingInput) => Promise<WritingDetail>
  getPrompt: (promptId: number) => Promise<PromptDetail>
  listPrompts: (filters?: PromptFilters) => Promise<PromptSummary[]>
  savePrompt: (promptId: number) => Promise<{ kind: "saved"; savedAt: string }>
  unsavePrompt: (promptId: number) => Promise<void>
}

export type PromptRepositoryMode = "api" | "local"

function readSavedPromptEntries(storage: StorageLike): SavedPromptEntry[] {
  const raw = storage.getItem(storageKeys.savedPromptEntries)
  if (!raw) {
    return []
  }

  try {
    return savedPromptEntriesJsonCodec.decode(raw)
  } catch {
    return []
  }
}

function writeSavedPromptEntries(
  storage: StorageLike,
  entries: SavedPromptEntry[]
): void {
  storage.setItem(
    storageKeys.savedPromptEntries,
    savedPromptEntriesJsonCodec.encode(entries)
  )
}

export function createLocalPromptRepository(
  storage: StorageLike = createMemoryStorage()
): PromptRepository {
  return {
    async createWriting() {
      throw createApiError(404, "로컬 모드에서는 글을 생성할 수 없습니다.")
    },

    async getPrompt() {
      throw createApiError(404, "글감을 찾을 수 없습니다.")
    },

    async listPrompts() {
      return []
    },

    async savePrompt(promptId) {
      const entries = readSavedPromptEntries(storage)
      const withoutCurrent = entries.filter(
        (entry) => entry.promptId !== promptId
      )
      const savedAt = new Date().toISOString()
      writeSavedPromptEntries(storage, [
        { promptId, savedAt },
        ...withoutCurrent,
      ])
      return {
        kind: "saved" as const,
        savedAt,
      }
    },

    async unsavePrompt(promptId) {
      const entries = readSavedPromptEntries(storage)
      writeSavedPromptEntries(
        storage,
        entries.filter((entry) => entry.promptId !== promptId)
      )
    },
  }
}

function createRemotePromptRepository(client: ApiClient): PromptRepository {
  return {
    async createWriting(input) {
      return throwOnError(
        await client.POST("/writings", {
          body: input,
        })
      ) as WritingDetail
    },
    async getPrompt(promptId) {
      return throwOnError(
        await client.GET("/prompts/{promptId}", {
          params: { path: { promptId } },
        })
      )
    },
    async listPrompts(filters) {
      const response = throwOnError(
        await client.GET("/prompts", {
          params: {
            query: {
              level: filters?.level,
              query: filters?.query,
              saved:
                filters?.saved !== undefined
                  ? (String(filters.saved) as "true" | "false")
                  : undefined,
              topic: filters?.topic,
            },
          },
        })
      )
      return response.items
    },
    async savePrompt(promptId) {
      return throwOnError(
        await client.PUT("/prompts/{promptId}/save", {
          params: { path: { promptId } },
        })
      )
    },
    async unsavePrompt(promptId) {
      const result = await client.DELETE("/prompts/{promptId}/save", {
        params: { path: { promptId } },
      })
      if (!result.response.ok) {
        throwOnError(result)
      }
    },
  }
}

function resolveMode(
  explicitMode?: PromptRepositoryMode
): PromptRepositoryMode {
  return explicitMode ?? env.NEXT_PUBLIC_CLIENT_MODE
}

export function createPromptRepository(options?: {
  client?: ApiClient
  mode?: PromptRepositoryMode
  storage?: StorageLike
}): PromptRepository {
  const storage = options?.storage ?? getDefaultStorage()
  const mode = resolveMode(options?.mode)

  if (mode === "local") {
    return createLocalPromptRepository(storage)
  }

  return createRemotePromptRepository(options?.client ?? createApiClient())
}
