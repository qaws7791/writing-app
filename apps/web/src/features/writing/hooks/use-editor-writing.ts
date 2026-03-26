"use client"

import {
  type FormEvent,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react"

import {
  consumeRedirectWritingSnapshot,
  createWritingSnapshotFromDetail,
  createEditorWritingSnapshot,
  createEmptyEditorWritingSnapshot,
  type EditorWritingSnapshot,
  normalizeWritingTitle,
  serializeWritingSnapshot,
} from "@/domain/writing/model/writing-sync.service"
import {
  writingContentToHtml,
  writingContentToPlainText,
} from "@/domain/writing/model/writing.service"
import type { WritingContent, WritingDetail } from "@/domain/writing"
import type { VersionDetail } from "@/features/writing/sync/types"

function extractTitle(text: string | null) {
  return normalizeWritingTitle(text ?? "")
}

function useRefState<T>(
  initialValue: T
): [T, (next: T) => void, MutableRefObject<T>] {
  const ref = useRef(initialValue)
  const [state, setState] = useState(initialValue)

  const set = useCallback((next: T) => {
    ref.current = next
    setState(next)
  }, [])

  return [state, set, ref]
}

type UseEditorWritingOptions = {
  writingDetail: WritingDetail | undefined
  writingId: number
}

export function useEditorWriting({
  writingDetail,
  writingId,
}: UseEditorWritingOptions) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const lastSyncedSnapshotRef = useRef<string | null>(null)
  const [lastSyncedSnapshot, setLastSyncedSnapshot] = useState<string | null>(
    null
  )
  const initializedForWritingIdRef = useRef<number | null>(null)

  const [editorWriting, setEditorWriting, editorWritingRef] =
    useRefState<EditorWritingSnapshot>(createEmptyEditorWritingSnapshot())

  useEffect(() => {
    if (!writingDetail || initializedForWritingIdRef.current === writingId)
      return
    initializedForWritingIdRef.current = writingId

    const redirectSnapshot = consumeRedirectWritingSnapshot(writingId)
    const nextEditorWriting =
      redirectSnapshot?.editorWriting ??
      createWritingSnapshotFromDetail(writingDetail)

    setEditorWriting(nextEditorWriting)

    const synced =
      redirectSnapshot?.lastSyncedSnapshot ??
      serializeWritingSnapshot(nextEditorWriting)
    lastSyncedSnapshotRef.current = synced
    startTransition(() => setLastSyncedSnapshot(synced))

    if (titleRef.current) {
      titleRef.current.textContent = nextEditorWriting.title
    }
  }, [writingDetail, writingId, setEditorWriting])

  const handleTitleInput = useCallback(
    (event: FormEvent<HTMLHeadingElement>) => {
      setEditorWriting(
        createEditorWritingSnapshot({
          content: editorWritingRef.current.content,
          title: extractTitle(event.currentTarget.textContent),
        })
      )
    },
    [editorWritingRef, setEditorWriting]
  )

  const handleContentChange = useCallback(
    (nextContent: WritingContent) => {
      setEditorWriting(
        createEditorWritingSnapshot({
          content: nextContent,
          title: editorWritingRef.current.title,
        })
      )
    },
    [editorWritingRef, setEditorWriting]
  )

  const getContent = useCallback(() => {
    return {
      bodyHtml: writingContentToHtml(editorWritingRef.current.content),
      bodyText: writingContentToPlainText(editorWritingRef.current.content),
      title: editorWritingRef.current.title,
    }
  }, [editorWritingRef])

  const markSynced = useCallback((snapshot: EditorWritingSnapshot) => {
    const serialized = serializeWritingSnapshot(snapshot)
    lastSyncedSnapshotRef.current = serialized
    setLastSyncedSnapshot(serialized)
  }, [])

  const restoreFromVersion = useCallback(
    (detail: VersionDetail) => {
      const nextEditorWriting = createEditorWritingSnapshot({
        content: detail.content,
        title: detail.title,
      })

      setEditorWriting(nextEditorWriting)

      const synced = serializeWritingSnapshot(nextEditorWriting)
      lastSyncedSnapshotRef.current = synced
      setLastSyncedSnapshot(synced)

      if (titleRef.current) {
        titleRef.current.textContent = detail.title
      }
    },
    [setEditorWriting]
  )

  const serializedEditorWriting = serializeWritingSnapshot(editorWriting)
  const hasPendingChanges =
    serializedEditorWriting !== lastSyncedSnapshot &&
    writingDetail !== undefined

  return {
    editorWriting,
    editorWritingRef,
    getContent,
    handleContentChange,
    handleTitleInput,
    hasPendingChanges,
    lastSyncedSnapshotRef,
    markSynced,
    restoreFromVersion,
    titleRef,
  }
}
