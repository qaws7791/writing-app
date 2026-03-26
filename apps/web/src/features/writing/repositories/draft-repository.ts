import type { DraftContent, DraftDetail, DraftSummary } from "@/domain/draft"
import { createEmptyDraftContent, getDraftMetrics } from "@/domain/draft"
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

export type AutosaveDraftResult = {
  draft: DraftDetail
  kind: "autosaved"
}

export type CreateDraftInput = {
  content?: DraftContent
  sourcePromptId?: number
  title?: string
}

export type DraftRepository = {
  autosaveDraft: (
    draftId: number,
    input: { content?: DraftContent; title?: string }
  ) => Promise<AutosaveDraftResult>
  createDraft: (input: CreateDraftInput) => Promise<DraftDetail>
  deleteDraft: (draftId: number) => Promise<void>
  getDraft: (draftId: number) => Promise<DraftDetail>
  getPrompt: (promptId: number) => Promise<PromptDetail>
  listDrafts: () => Promise<DraftSummary[]>
}

export type DraftRepositoryMode = "api" | "local"

export type RemoteApiError = ApiError

function readDrafts(storage: StorageLike): DraftDetail[] {
  const raw = storage.getItem(storageKeys.drafts)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as DraftDetail[]
  } catch {
    return []
  }
}

function writeDrafts(storage: StorageLike, drafts: DraftDetail[]): void {
  storage.setItem(storageKeys.drafts, JSON.stringify(drafts))
}

function nextSequence(storage: StorageLike): number {
  const raw = storage.getItem(storageKeys.sequence)
  const current = raw ? Number(raw) : 200
  const next = Number.isFinite(current) ? current + 1 : 201
  storage.setItem(storageKeys.sequence, String(next))
  return next
}

function sortDrafts(drafts: DraftDetail[]): DraftDetail[] {
  return [...drafts].sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return right.id - left.id
    }

    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

export function createLocalDraftRepository(
  storage: StorageLike = createMemoryStorage()
): DraftRepository {
  return {
    async autosaveDraft(draftId, input) {
      const drafts = readDrafts(storage)
      const current = drafts.find((draft) => draft.id === draftId)
      if (!current) {
        throw createApiError(404, "초안을 찾을 수 없습니다.")
      }

      const nextContent = input.content ?? current.content
      const metrics = getDraftMetrics(nextContent)
      const now = new Date().toISOString()

      const updated: DraftDetail = {
        ...current,
        characterCount: metrics.characterCount,
        content: nextContent,
        lastSavedAt: now,
        preview: metrics.preview,
        title: input.title ?? current.title,
        updatedAt: now,
        wordCount: metrics.wordCount,
      }

      writeDrafts(
        storage,
        sortDrafts(
          drafts.map((draft) => (draft.id === draftId ? updated : draft))
        )
      )

      return {
        draft: updated,
        kind: "autosaved",
      }
    },

    async createDraft(input) {
      const drafts = readDrafts(storage)
      const content = input.content ?? createEmptyDraftContent()
      const metrics = getDraftMetrics(content)
      const now = new Date().toISOString()

      const created: DraftDetail = {
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

      writeDrafts(storage, sortDrafts([created, ...drafts]))
      return created
    },

    async deleteDraft(draftId) {
      const drafts = readDrafts(storage)
      writeDrafts(
        storage,
        drafts.filter((draft) => draft.id !== draftId)
      )
    },

    async getDraft(draftId) {
      const draft = readDrafts(storage).find((item) => item.id === draftId)
      if (!draft) {
        throw createApiError(404, "초안을 찾을 수 없습니다.")
      }
      return draft
    },

    async getPrompt() {
      throw createApiError(404, "글감을 찾을 수 없습니다.")
    },

    async listDrafts() {
      return sortDrafts(readDrafts(storage))
    },
  }
}

function createRemoteDraftRepository(apiBaseUrl: string): DraftRepository {
  const client = createApiClient({ baseUrl: apiBaseUrl })

  return {
    async autosaveDraft(draftId, input) {
      return throwOnError(
        await client.PATCH("/drafts/{draftId}", {
          params: { path: { draftId } },
          body: input,
        })
      )
    },
    async createDraft(input) {
      return throwOnError(
        await client.POST("/drafts", {
          body: input,
        })
      )
    },
    async deleteDraft(draftId) {
      const result = await client.DELETE("/drafts/{draftId}", {
        params: { path: { draftId } },
      })
      if (!result.response.ok) {
        throwOnError(result)
      }
    },
    async getDraft(draftId) {
      return throwOnError(
        await client.GET("/drafts/{draftId}", {
          params: { path: { draftId } },
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
    async listDrafts() {
      const { items } = throwOnError(await client.GET("/drafts"))
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

function resolveMode(explicitMode?: DraftRepositoryMode): DraftRepositoryMode {
  return explicitMode ?? env.NEXT_PUBLIC_PHASE_ONE_MODE
}

export function createDraftRepository(options?: {
  apiBaseUrl?: string
  mode?: DraftRepositoryMode
  storage?: StorageLike
}): DraftRepository {
  const storage = options?.storage ?? getDefaultStorage()
  const mode = resolveMode(options?.mode)

  if (mode === "local") {
    return createLocalDraftRepository(storage)
  }

  const apiBaseUrl = resolveApiBaseUrl(options?.apiBaseUrl)
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in api mode.")
  }

  return createRemoteDraftRepository(apiBaseUrl)
}
