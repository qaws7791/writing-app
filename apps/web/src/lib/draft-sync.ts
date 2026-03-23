import { createEmptyDraftContent, draftContentToPlainText } from "./rich-text"
import { getSessionStorage, storageKeys } from "./storage"
import type { DraftContent, DraftDetail } from "./web-types"

export type EditorDraftSnapshot = {
  content: DraftContent
  title: string
}

export type DraftSyncState = "error" | "idle" | "saved" | "saving"

type RedirectDraftSnapshot = {
  editorDraft: EditorDraftSnapshot
  lastSyncedSnapshot: string | null
}

export function normalizeDraftTitle(title: string) {
  return title.replace(/\s+/g, " ").trim()
}

export function createEditorDraftSnapshot(
  snapshot: EditorDraftSnapshot
): EditorDraftSnapshot {
  return {
    content: snapshot.content,
    title: normalizeDraftTitle(snapshot.title),
  }
}

export function createEmptyEditorDraftSnapshot(): EditorDraftSnapshot {
  return {
    content: createEmptyDraftContent(),
    title: "",
  }
}

export function createDraftSnapshotFromDetail(
  draft: DraftDetail
): EditorDraftSnapshot {
  return createEditorDraftSnapshot({
    content: draft.content,
    title: draft.title,
  })
}

export function serializeDraftSnapshot(snapshot: EditorDraftSnapshot) {
  return JSON.stringify({
    content: snapshot.content,
    title: normalizeDraftTitle(snapshot.title),
  })
}

export function areDraftSnapshotsEqual(
  left: EditorDraftSnapshot,
  right: EditorDraftSnapshot
) {
  return serializeDraftSnapshot(left) === serializeDraftSnapshot(right)
}

export function hasMeaningfulDraftInput(snapshot: EditorDraftSnapshot) {
  return (
    snapshot.title.trim().length > 0 ||
    draftContentToPlainText(snapshot.content).length > 0
  )
}

function createRedirectDraftSnapshotStorageKey(draftId: number) {
  return `${storageKeys.redirectDraftSnapshotPrefix}.${draftId}`
}

export function consumeRedirectDraftSnapshot(
  draftId: number
): RedirectDraftSnapshot | null {
  const storage = getSessionStorage()
  const key = createRedirectDraftSnapshotStorageKey(draftId)
  const raw = storage.getItem(key)

  if (!raw) {
    return null
  }

  storage.removeItem(key)

  try {
    return JSON.parse(raw) as RedirectDraftSnapshot
  } catch {
    return null
  }
}

export function persistRedirectDraftSnapshot(
  draftId: number,
  snapshot: RedirectDraftSnapshot
) {
  const storage = getSessionStorage()

  storage.setItem(
    createRedirectDraftSnapshotStorageKey(draftId),
    JSON.stringify(snapshot)
  )
}
