type StorageLike = {
  getItem: (key: string) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

type MemoryStorageState = Map<string, string>

export const phaseOneStorageKeys = {
  drafts: "phase-one.drafts",
  savedPromptEntries: "phase-one.saved-prompts",
  sequence: "phase-one.sequence",
} as const

export function createMemoryStorage(
  initialEntries?: Record<string, string>
): StorageLike {
  const state: MemoryStorageState = new Map(
    Object.entries(initialEntries ?? {})
  )

  return {
    getItem(key) {
      return state.get(key) ?? null
    },
    removeItem(key) {
      state.delete(key)
    },
    setItem(key, value) {
      state.set(key, value)
    },
  }
}

const inMemoryStorage = createMemoryStorage()

export function getDefaultStorage(): StorageLike {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage
  }

  return inMemoryStorage
}

export type { StorageLike }
