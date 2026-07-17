"use client"

const lessonDraftStorageVersion = "v2"
const lessonDraftMaxLength = 20_000
const draftMemoryCache = new Map<string, string>()
const draftChangeListeners = new Map<string, Set<() => void>>()
let listensForStorageChanges = false

export type LessonDraftWriteResult =
  | { readonly status: "quota-exceeded" }
  | { readonly status: "saved" }
  | { readonly status: "unavailable" }

export function readLessonDraftText(userId: string, stepId: string): string {
  if (typeof window === "undefined") {
    return ""
  }

  listenForStorageChanges()

  const key = createLessonDraftKey(userId, stepId)
  const cached = draftMemoryCache.get(key)

  if (cached !== undefined) {
    return cached
  }

  try {
    const stored = window.localStorage.getItem(key)
    discardUnscopedLessonDrafts(stepId)
    const value = normalizeDraftText(stored ?? "")

    draftMemoryCache.set(key, value)

    return value
  } catch {
    return ""
  }
}

export function writeLessonDraftText(
  userId: string,
  stepId: string,
  text: string
): LessonDraftWriteResult {
  if (typeof window === "undefined") {
    return { status: "unavailable" }
  }

  listenForStorageChanges()

  const key = createLessonDraftKey(userId, stepId)
  const value = normalizeDraftText(text)

  draftMemoryCache.set(key, value)
  notifyLessonDraftChange(key)

  try {
    window.localStorage.setItem(key, value)
    return { status: "saved" }
  } catch (error) {
    return {
      status: isStorageQuotaExceeded(error) ? "quota-exceeded" : "unavailable",
    }
  }
}

export function clearLessonDraftsForUser(userId: string): void {
  const prefix = createLessonDraftUserPrefix(userId)

  for (const key of draftMemoryCache.keys()) {
    if (key.startsWith(prefix)) {
      draftMemoryCache.delete(key)
    }
  }

  if (typeof window === "undefined") {
    notifyLessonDraftUserChanges(prefix)
    return
  }

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)

      if (key?.startsWith(prefix)) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // 메모리 초안은 이미 제거했으며 사용할 수 없는 저장소는 그대로 둔다.
  }

  notifyLessonDraftUserChanges(prefix)
}

export function subscribeToLessonDraftText(
  userId: string,
  stepId: string,
  listener: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }

  listenForStorageChanges()

  const key = createLessonDraftKey(userId, stepId)
  const listeners = draftChangeListeners.get(key) ?? new Set<() => void>()

  listeners.add(listener)
  draftChangeListeners.set(key, listeners)

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0) {
      draftChangeListeners.delete(key)
    }
  }
}

function createLessonDraftKey(userId: string, stepId: string): string {
  return `${createLessonDraftUserPrefix(userId)}${encodeURIComponent(stepId)}`
}

function createLessonDraftUserPrefix(userId: string): string {
  return `writing-app:lesson-draft:${lessonDraftStorageVersion}:${encodeURIComponent(userId)}:`
}

function createLegacyLessonDraftKey(stepId: string): string {
  return `writing-app-draft-${stepId}`
}

function createVersionOneLessonDraftKey(stepId: string): string {
  return `writing-app:lesson-draft:v1:${stepId}`
}

function discardUnscopedLessonDrafts(stepId: string): void {
  window.localStorage.removeItem(createVersionOneLessonDraftKey(stepId))
  window.localStorage.removeItem(createLegacyLessonDraftKey(stepId))
}

function normalizeDraftText(text: string): string {
  return text.slice(0, lessonDraftMaxLength)
}

function isStorageQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.code === 22 ||
      error.code === 1014)
  )
}

function listenForStorageChanges(): void {
  if (listensForStorageChanges) {
    return
  }

  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      draftMemoryCache.clear()
      notifyAllLessonDraftChanges()
      return
    }

    draftMemoryCache.delete(event.key)
    notifyLessonDraftChange(event.key)
  })
  listensForStorageChanges = true
}

function notifyLessonDraftChange(key: string): void {
  for (const listener of draftChangeListeners.get(key) ?? []) {
    listener()
  }
}

function notifyLessonDraftUserChanges(prefix: string): void {
  for (const [key, listeners] of draftChangeListeners) {
    if (!key.startsWith(prefix)) continue
    for (const listener of listeners) listener()
  }
}

function notifyAllLessonDraftChanges(): void {
  for (const listeners of draftChangeListeners.values()) {
    for (const listener of listeners) listener()
  }
}
