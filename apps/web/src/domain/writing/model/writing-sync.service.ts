import { z } from "zod"
import { jsonCodec } from "@/foundation/lib/zod"
import { writingContentSchema } from "@/domain/writing/model/writing.service"
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

const editorWritingSnapshotSchema = z.object({
  content: writingContentSchema,
  title: z.string(),
})

const redirectWritingSnapshotSchema = z.object({
  editorWriting: editorWritingSnapshotSchema,
  lastSyncedSnapshot: z.string().nullable(),
})

const editorWritingSnapshotJsonCodec = jsonCodec(editorWritingSnapshotSchema)

const redirectWritingSnapshotJsonCodec = jsonCodec(
  redirectWritingSnapshotSchema
)

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
  return editorWritingSnapshotJsonCodec.encode(snapshot)
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
    return redirectWritingSnapshotJsonCodec.decode(raw)
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
    redirectWritingSnapshotJsonCodec.encode(snapshot)
  )
}
