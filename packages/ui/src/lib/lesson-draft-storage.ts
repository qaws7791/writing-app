const lessonDraftStorageVersion = "v1"
const lessonDraftMaxLength = 20_000
const draftMemoryCache = new Map<string, string>()
let listensForStorageChanges = false

export function readLessonDraftText(stepId: string): string {
  if (typeof window === "undefined") {
    return ""
  }

  listenForStorageChanges()

  const key = createLessonDraftKey(stepId)
  const cached = draftMemoryCache.get(key)

  if (cached !== undefined) {
    return cached
  }

  try {
    const stored = window.localStorage.getItem(key)
    const legacyKey = createLegacyLessonDraftKey(stepId)
    const legacy =
      stored === null ? window.localStorage.getItem(legacyKey) : null
    const value = normalizeDraftText(stored ?? legacy ?? "")

    draftMemoryCache.set(key, value)

    if (stored === null && legacy !== null) {
      window.localStorage.setItem(key, value)
      window.localStorage.removeItem(legacyKey)
    }

    return value
  } catch {
    return ""
  }
}

export function writeLessonDraftText(stepId: string, text: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  listenForStorageChanges()

  const key = createLessonDraftKey(stepId)
  const value = normalizeDraftText(text)

  draftMemoryCache.set(key, value)

  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function createLessonDraftKey(stepId: string): string {
  return `writing-app:lesson-draft:${lessonDraftStorageVersion}:${stepId}`
}

function createLegacyLessonDraftKey(stepId: string): string {
  return `writing-app-draft-${stepId}`
}

function normalizeDraftText(text: string): string {
  return text.slice(0, lessonDraftMaxLength)
}

function listenForStorageChanges(): void {
  if (listensForStorageChanges) {
    return
  }

  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      draftMemoryCache.clear()
      return
    }

    draftMemoryCache.delete(event.key)
  })
  listensForStorageChanges = true
}
