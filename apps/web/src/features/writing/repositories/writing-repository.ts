import type {
  WritingContent,
  WritingDetail,
  WritingSummary,
} from "@/domain/writing"
import { createEmptyWritingContent, getWritingMetrics } from "@/domain/writing"
import type { PromptDetail } from "@/domain/prompt"
import { createApiClient } from "@/foundation/api/client"
import {
  createApiError,
  throwOnError,
  type ApiError,
} from "@/foundation/api/error"
import { env } from "@/foundation/config/env"
import { resolveBrowserApiBaseUrl } from "@/foundation/lib/api-base-url"
import {
  createMemoryStorage,
  getDefaultStorage,
  storageKeys,
  type StorageLike,
} from "@/foundation/lib/storage"

export type AutosaveWritingResult = {
  writing: WritingDetail
  kind: "autosaved"
}

export type CreateWritingInput = {
  content?: WritingContent
  sourcePromptId?: number
  title?: string
}

export type WritingRepository = {
  autosaveWriting: (
    writingId: number,
    input: { content?: WritingContent; title?: string }
  ) => Promise<AutosaveWritingResult>
  createWriting: (input: CreateWritingInput) => Promise<WritingDetail>
  deleteWriting: (writingId: number) => Promise<void>
  getWriting: (writingId: number) => Promise<WritingDetail>
  getPrompt: (promptId: number) => Promise<PromptDetail>
  listWritings: () => Promise<WritingSummary[]>
}

export type WritingRepositoryMode = "api" | "local"

export type RemoteApiError = ApiError

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

function writeWritings(storage: StorageLike, writings: WritingDetail[]): void {
  storage.setItem(storageKeys.writings, JSON.stringify(writings))
}

function nextSequence(storage: StorageLike): number {
  const raw = storage.getItem(storageKeys.sequence)
  const current = raw ? Number(raw) : 200
  const next = Number.isFinite(current) ? current + 1 : 201
  storage.setItem(storageKeys.sequence, String(next))
  return next
}

function sortWritings(writings: WritingDetail[]): WritingDetail[] {
  return [...writings].sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return right.id - left.id
    }

    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

export function createLocalWritingRepository(
  storage: StorageLike = createMemoryStorage()
): WritingRepository {
  return {
    async autosaveWriting(writingId, input) {
      const writings = readWritings(storage)
      const current = writings.find((writing) => writing.id === writingId)
      if (!current) {
        throw createApiError(404, "글을 찾을 수 없습니다.")
      }

      const nextContent = input.content ?? current.content
      const metrics = getWritingMetrics(nextContent)
      const now = new Date().toISOString()

      const updated: WritingDetail = {
        ...current,
        characterCount: metrics.characterCount,
        content: nextContent,
        lastSavedAt: now,
        preview: metrics.preview,
        title: input.title ?? current.title,
        updatedAt: now,
        wordCount: metrics.wordCount,
      }

      writeWritings(
        storage,
        sortWritings(
          writings.map((writing) =>
            writing.id === writingId ? updated : writing
          )
        )
      )

      return {
        writing: updated,
        kind: "autosaved",
      }
    },

    async createWriting(input) {
      const writings = readWritings(storage)
      const content = input.content ?? createEmptyWritingContent()
      const metrics = getWritingMetrics(content)
      const now = new Date().toISOString()

      const created: WritingDetail = {
        characterCount: metrics.characterCount,
        content,
        createdAt: now,
        id: nextSequence(storage),
        lastSavedAt: now,
        preview: metrics.preview,
        sourcePromptId: input.sourcePromptId ?? null,
        title: input.title ?? "",
        updatedAt: now,
        wordCount: metrics.wordCount,
      }

      writeWritings(storage, sortWritings([created, ...writings]))
      return created
    },

    async deleteWriting(writingId) {
      const writings = readWritings(storage)
      writeWritings(
        storage,
        writings.filter((writing) => writing.id !== writingId)
      )
    },

    async getWriting(writingId) {
      const writing = readWritings(storage).find(
        (item) => item.id === writingId
      )
      if (!writing) {
        throw createApiError(404, "글을 찾을 수 없습니다.")
      }
      return writing
    },

    async getPrompt() {
      throw createApiError(404, "글감을 찾을 수 없습니다.")
    },

    async listWritings() {
      return sortWritings(readWritings(storage))
    },
  }
}

function createRemoteWritingRepository(apiBaseUrl: string): WritingRepository {
  const client = createApiClient({ baseUrl: apiBaseUrl })

  return {
    async autosaveWriting(writingId, input) {
      return throwOnError(
        await client.PATCH("/writings/{writingId}", {
          params: { path: { writingId } },
          body: input,
        })
      )
    },
    async createWriting(input) {
      return throwOnError(
        await client.POST("/writings", {
          body: input,
        })
      )
    },
    async deleteWriting(writingId) {
      const result = await client.DELETE("/writings/{writingId}", {
        params: { path: { writingId } },
      })
      if (!result.response.ok) {
        throwOnError(result)
      }
    },
    async getWriting(writingId) {
      return throwOnError(
        await client.GET("/writings/{writingId}", {
          params: { path: { writingId } },
        })
      )
    },
    async getPrompt(promptId) {
      return throwOnError(
        await client.GET("/prompts/{promptId}", {
          params: { path: { promptId } },
        })
      )
    },
    async listWritings() {
      const { items } = throwOnError(await client.GET("/writings"))
      return items
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

function resolveMode(
  explicitMode?: WritingRepositoryMode
): WritingRepositoryMode {
  return explicitMode ?? env.NEXT_PUBLIC_PHASE_ONE_MODE
}

export function createWritingRepository(options?: {
  apiBaseUrl?: string
  mode?: WritingRepositoryMode
  storage?: StorageLike
}): WritingRepository {
  const storage = options?.storage ?? getDefaultStorage()
  const mode = resolveMode(options?.mode)

  if (mode === "local") {
    return createLocalWritingRepository(storage)
  }

  const apiBaseUrl = resolveApiBaseUrl(options?.apiBaseUrl)
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in api mode.")
  }

  return createRemoteWritingRepository(apiBaseUrl)
}
