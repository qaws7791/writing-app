import {
  createFixtureDraftContent,
  createFixtureHomeSnapshot,
  findFixturePrompt,
  listFixturePromptSummaries,
} from "./phase-one-fixtures"
import { createEmptyDraftContent, getDraftMetrics } from "./phase-one-rich-text"
import {
  createMemoryStorage,
  getDefaultStorage,
  phaseOneStorageKeys,
  type StorageLike,
} from "./phase-one-storage"
import { resolveBrowserApiBaseUrl } from "./api-base-url"
import { createApiClient } from "@/foundation/api/client"
import {
  createApiError,
  throwOnError,
  type ApiError,
} from "@/foundation/api/error"
import { env } from "@/env"
import type {
  DraftContent,
  DraftDetail,
  DraftSummary,
  HomeSnapshot,
  PromptDetail,
  PromptFilters,
  PromptSummary,
} from "./phase-one-types"

export type AutosaveDraftResult = {
  draft: DraftDetail
  kind: "autosaved"
}

type SavedPromptEntry = {
  promptId: number
  savedAt: string
}

export type CreateDraftInput = {
  content?: DraftContent
  sourcePromptId?: number
  title?: string
}

export type PhaseOneRepositoryMode = "api" | "local"

export type PhaseOneRepository = {
  autosaveDraft: (
    draftId: number,
    input: { content?: DraftContent; title?: string }
  ) => Promise<AutosaveDraftResult>
  createDraft: (input: CreateDraftInput) => Promise<DraftDetail>
  deleteDraft: (draftId: number) => Promise<void>
  getDraft: (draftId: number) => Promise<DraftDetail>
  getHome: () => Promise<HomeSnapshot>
  getPrompt: (promptId: number) => Promise<PromptDetail>
  listDrafts: () => Promise<DraftSummary[]>
  listPrompts: (filters?: PromptFilters) => Promise<PromptSummary[]>
  savePrompt: (promptId: number) => Promise<{ kind: "saved"; savedAt: string }>
  unsavePrompt: (promptId: number) => Promise<void>
}

export type RemoteApiError = ApiError

function readSavedPromptEntries(storage: StorageLike): SavedPromptEntry[] {
  const raw = storage.getItem(phaseOneStorageKeys.savedPromptEntries)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as SavedPromptEntry[]
  } catch {
    return []
  }
}

function writeSavedPromptEntries(
  storage: StorageLike,
  entries: SavedPromptEntry[]
): void {
  storage.setItem(
    phaseOneStorageKeys.savedPromptEntries,
    JSON.stringify(entries)
  )
}

function readDrafts(storage: StorageLike): DraftDetail[] {
  const raw = storage.getItem(phaseOneStorageKeys.drafts)
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
  storage.setItem(phaseOneStorageKeys.drafts, JSON.stringify(drafts))
}

function nextSequence(storage: StorageLike): number {
  const raw = storage.getItem(phaseOneStorageKeys.sequence)
  const current = raw ? Number(raw) : 200
  const next = Number.isFinite(current) ? current + 1 : 201
  storage.setItem(phaseOneStorageKeys.sequence, String(next))
  return next
}

function applySavedState(
  prompt: PromptSummary,
  savedIds: Set<number>
): PromptSummary {
  return {
    ...prompt,
    saved: savedIds.has(prompt.id),
  }
}

function applySavedStateToDetail(
  prompt: PromptDetail,
  savedIds: Set<number>
): PromptDetail {
  return {
    ...prompt,
    saved: savedIds.has(prompt.id),
  }
}

function sortDrafts(drafts: DraftDetail[]): DraftDetail[] {
  return [...drafts].sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return right.id - left.id
    }

    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

function filterPrompts(
  prompts: PromptSummary[],
  filters?: PromptFilters
): PromptSummary[] {
  if (!filters) {
    return prompts
  }

  const normalizedQuery = filters.query?.trim().toLowerCase()

  return prompts.filter((prompt) => {
    if (filters.saved !== undefined && prompt.saved !== filters.saved) {
      return false
    }

    if (filters.topic && prompt.topic !== filters.topic) {
      return false
    }

    if (filters.level && prompt.level !== filters.level) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return (
      prompt.text.toLowerCase().includes(normalizedQuery) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    )
  })
}

export function createLocalPhaseOneRepository(
  storage: StorageLike = createMemoryStorage()
): PhaseOneRepository {
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
      const draft =
        readDrafts(storage).find((item) => item.id === draftId) ??
        (() => {
          const fallback = createFixtureHomeSnapshot().recentDrafts[0]
          if (fallback && fallback.id === draftId) {
            return {
              ...fallback,
              content: createFixtureDraftContent(),
              createdAt: fallback.lastSavedAt,
              updatedAt: fallback.lastSavedAt,
            } satisfies DraftDetail
          }

          return null
        })()

      if (!draft) {
        throw createApiError(404, "초안을 찾을 수 없습니다.")
      }

      return draft
    },

    async getHome() {
      const fixture = createFixtureHomeSnapshot()
      const drafts = sortDrafts(readDrafts(storage))
      const savedEntries = readSavedPromptEntries(storage)
      const savedIds = new Set(savedEntries.map((entry) => entry.promptId))
      const promptMap = new Map(
        listFixturePromptSummaries().map((prompt) => [prompt.id, prompt])
      )

      return {
        recentDrafts: drafts.length > 0 ? drafts : fixture.recentDrafts,
        resumeDraft: drafts[0] ?? fixture.resumeDraft,
        savedPrompts:
          savedEntries.length > 0
            ? savedEntries
                .map((entry) => promptMap.get(entry.promptId))
                .filter((prompt): prompt is PromptSummary => Boolean(prompt))
                .map((prompt) => ({ ...prompt, saved: true }))
            : fixture.savedPrompts,
        todayPrompts: fixture.todayPrompts.map((prompt) =>
          applySavedState(prompt, savedIds)
        ),
      }
    },

    async getPrompt(promptId) {
      const prompt = findFixturePrompt(promptId)
      if (!prompt) {
        throw createApiError(404, "글감을 찾을 수 없습니다.")
      }

      const savedIds = new Set(
        readSavedPromptEntries(storage).map((entry) => entry.promptId)
      )

      return applySavedStateToDetail(prompt, savedIds)
    },

    async listDrafts() {
      const drafts = sortDrafts(readDrafts(storage))
      return drafts.length > 0
        ? drafts
        : createFixtureHomeSnapshot().recentDrafts
    },

    async listPrompts(filters) {
      const savedIds = new Set(
        readSavedPromptEntries(storage).map((entry) => entry.promptId)
      )
      const prompts = listFixturePromptSummaries().map((prompt) =>
        applySavedState(prompt, savedIds)
      )

      return filterPrompts(prompts, filters)
    },

    async savePrompt(promptId) {
      const prompt = findFixturePrompt(promptId)
      if (!prompt) {
        throw createApiError(404, "글감을 찾을 수 없습니다.")
      }

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

function createRemotePhaseOneRepository(
  apiBaseUrl: string
): PhaseOneRepository {
  const client = createApiClient({ baseUrl: apiBaseUrl })

  return {
    async autosaveDraft(draftId, input) {
      return throwOnError(
        await client.PATCH("/drafts/{draftId}", {
          params: { path: { draftId } },
          body: input,
        })
      ) as AutosaveDraftResult
    },
    async createDraft(input) {
      return throwOnError(
        await client.POST("/drafts", {
          body: input,
        })
      ) as DraftDetail
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
      ) as DraftDetail
    },
    async getHome() {
      return throwOnError(await client.GET("/home")) as HomeSnapshot
    },
    async getPrompt(promptId) {
      return throwOnError(
        await client.GET("/prompts/{promptId}", {
          params: { path: { promptId } },
        })
      ) as PromptDetail
    },
    async listDrafts() {
      const response = throwOnError(await client.GET("/drafts"))
      return response.items as DraftSummary[]
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
      return response.items as PromptSummary[]
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

function resolveRepositoryMode(
  explicitMode?: PhaseOneRepositoryMode
): PhaseOneRepositoryMode {
  return explicitMode ?? env.NEXT_PUBLIC_PHASE_ONE_MODE
}

export function createPhaseOneRepository(options?: {
  apiBaseUrl?: string
  mode?: PhaseOneRepositoryMode
  storage?: StorageLike
}): PhaseOneRepository {
  const storage = options?.storage ?? getDefaultStorage()
  const mode = resolveRepositoryMode(options?.mode)

  if (mode === "local") {
    return createLocalPhaseOneRepository(storage)
  }

  const apiBaseUrl = resolveApiBaseUrl(options?.apiBaseUrl)
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in api mode.")
  }

  return createRemotePhaseOneRepository(apiBaseUrl)
}
