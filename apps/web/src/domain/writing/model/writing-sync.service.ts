import {
  createEmptyWritingContent,
  writingContentToPlainText,
} from "@/domain/writing/model/writing.service"
import { getSessionStorage, storageKeys } from "@/foundation/lib/storage"
import type {
  WritingContent,
  WritingDetail,
} from "@/domain/writing/model/writing.types"

export type EditorWritingSnapshot = {
  content: WritingContent
  title: string
}

export type WritingSyncState = "error" | "idle" | "saved" | "saving"

type RedirectWritingSnapshot = {
  editorWriting: EditorWritingSnapshot
  lastSyncedSnapshot: string | null
}

export function normalizeWritingTitle(title: string) {
  return title.replace(/\s+/g, " ").trim()
}

export function createEditorWritingSnapshot(
  snapshot: EditorWritingSnapshot
): EditorWritingSnapshot {
  return {
    content: snapshot.content,
    title: normalizeWritingTitle(snapshot.title),
  }
}

export function createEmptyEditorWritingSnapshot(): EditorWritingSnapshot {
  return {
    content: createEmptyWritingContent(),
    title: "",
  }
}

export function createWritingSnapshotFromDetail(
  writing: WritingDetail
): EditorWritingSnapshot {
  return createEditorWritingSnapshot({
    content: writing.content,
    title: writing.title,
  })
}

export function serializeWritingSnapshot(snapshot: EditorWritingSnapshot) {
  return JSON.stringify({
    content: snapshot.content,
    title: normalizeWritingTitle(snapshot.title),
  })
}

export function areWritingSnapshotsEqual(
  left: EditorWritingSnapshot,
  right: EditorWritingSnapshot
) {
  return serializeWritingSnapshot(left) === serializeWritingSnapshot(right)
}

export function hasMeaningfulWritingInput(snapshot: EditorWritingSnapshot) {
  return (
    snapshot.title.trim().length > 0 ||
    writingContentToPlainText(snapshot.content).length > 0
  )
}

function createRedirectWritingSnapshotStorageKey(writingId: number) {
  return `${storageKeys.redirectWritingSnapshotPrefix}.${writingId}`
}

export function consumeRedirectWritingSnapshot(
  writingId: number
): RedirectWritingSnapshot | null {
  const storage = getSessionStorage()
  const key = createRedirectWritingSnapshotStorageKey(writingId)
  const raw = storage.getItem(key)

  if (!raw) {
    return null
  }

  storage.removeItem(key)

  try {
    return JSON.parse(raw) as RedirectWritingSnapshot
  } catch {
    return null
  }
}

export function persistRedirectWritingSnapshot(
  writingId: number,
  snapshot: RedirectWritingSnapshot
) {
  const storage = getSessionStorage()

  storage.setItem(
    createRedirectWritingSnapshotStorageKey(writingId),
    JSON.stringify(snapshot)
  )
}
