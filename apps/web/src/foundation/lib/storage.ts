type StorageLike = {
  getItem: (key: string) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

type MemoryStorageState = Map<string, string>

export const storageKeys = {
  writings: "writing-app.writings",
  redirectWritingSnapshotPrefix: "writing-app.redirect-writing",
  savedPromptEntries: "writing-app.saved-prompts",
  sequence: "writing-app.sequence",
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
const inMemorySessionStorage = createMemoryStorage()

export function getDefaultStorage(): StorageLike {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage
  }

  return inMemoryStorage
}

export function getSessionStorage(): StorageLike {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage
  }

  return inMemorySessionStorage
}

export type { StorageLike }
