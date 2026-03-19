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

type SavedPromptEntry = {
  promptId: number
  savedAt: string
}

type PhaseOneRepositoryMode = "api" | "local"

type PhaseOneRepository = {
  autosaveDraft: (
    draftId: number,
    input: { content?: DraftContent; title?: string }
  ) => Promise<{ draft: DraftDetail; kind: "autosaved" }>
  createDraft: (input: {
    content?: DraftContent
    sourcePromptId?: number
    title?: string
  }) => Promise<DraftDetail>
  deleteDraft: (draftId: number) => Promise<void>
  getDraft: (draftId: number) => Promise<DraftDetail>
  getHome: () => Promise<HomeSnapshot>
  getPrompt: (promptId: number) => Promise<PromptDetail>
  listDrafts: () => Promise<DraftSummary[]>
  listPrompts: (filters?: PromptFilters) => Promise<PromptSummary[]>
  savePrompt: (promptId: number) => Promise<{ kind: "saved"; savedAt: string }>
  unsavePrompt: (promptId: number) => Promise<void>
}

type RemoteApiError = Error & {
  status: number
}

function createRemoteApiError(status: number, message: string): RemoteApiError {
  const error = new Error(message) as RemoteApiError
  error.status = status
  return error
}

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
        throw createRemoteApiError(404, "초안을 찾을 수 없습니다.")
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
        throw createRemoteApiError(404, "초안을 찾을 수 없습니다.")
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
        throw createRemoteApiError(404, "글감을 찾을 수 없습니다.")
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
        throw createRemoteApiError(404, "글감을 찾을 수 없습니다.")
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

async function readJsonResponse<TResponse>(
  response: Response
): Promise<TResponse> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string }
    } | null
    throw createRemoteApiError(
      response.status,
      payload?.error?.message ?? "API 요청에 실패했습니다."
    )
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

function createRemotePhaseOneRepository(
  apiBaseUrl: string
): PhaseOneRepository {
  const request = async <TResponse>(
    path: string,
    init?: RequestInit
  ): Promise<TResponse> => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    })

    return readJsonResponse<TResponse>(response)
  }

  return {
    autosaveDraft(draftId, input) {
      return request(`/drafts/${draftId}`, {
        body: JSON.stringify(input),
        method: "PATCH",
      })
    },
    createDraft(input) {
      return request("/drafts", {
        body: JSON.stringify(input),
        method: "POST",
      })
    },
    deleteDraft(draftId) {
      return request(`/drafts/${draftId}`, {
        method: "DELETE",
      })
    },
    getDraft(draftId) {
      return request(`/drafts/${draftId}`)
    },
    getHome() {
      return request("/home")
    },
    getPrompt(promptId) {
      return request(`/prompts/${promptId}`)
    },
    async listDrafts() {
      const response = await request<{ items: DraftSummary[] }>("/drafts")
      return response.items
    },
    async listPrompts(filters) {
      const searchParams = new URLSearchParams()

      if (filters?.query) {
        searchParams.set("query", filters.query)
      }
      if (filters?.topic) {
        searchParams.set("topic", filters.topic)
      }
      if (filters?.level) {
        searchParams.set("level", String(filters.level))
      }
      if (filters?.saved !== undefined) {
        searchParams.set("saved", String(filters.saved))
      }

      const query = searchParams.toString()
      const response = await request<{ items: PromptSummary[] }>(
        `/prompts${query ? `?${query}` : ""}`
      )
      return response.items
    },
    savePrompt(promptId) {
      return request(`/prompts/${promptId}/save`, {
        method: "PUT",
      })
    },
    unsavePrompt(promptId) {
      return request(`/prompts/${promptId}/save`, {
        method: "DELETE",
      })
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

  return envBaseUrl.replace(/\/$/, "")
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
