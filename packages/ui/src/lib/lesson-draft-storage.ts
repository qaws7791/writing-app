const lessonDraftStorageVersion = "v2"
const lessonDraftMaxLength = 20_000
const draftMemoryCache = new Map<string, string>()
let listensForStorageChanges = false

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
): boolean {
  if (typeof window === "undefined") {
    return false
  }

  listenForStorageChanges()

  const key = createLessonDraftKey(userId, stepId)
  const value = normalizeDraftText(text)

  draftMemoryCache.set(key, value)

  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
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
