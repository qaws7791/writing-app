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
  consumeRedirectDraftSnapshot,
  createDraftSnapshotFromDetail,
  createEditorDraftSnapshot,
  createEmptyEditorDraftSnapshot,
  type EditorDraftSnapshot,
  normalizeDraftTitle,
  serializeDraftSnapshot,
} from "@/domain/draft/model/draft-sync.service"
import {
  draftContentToHtml,
  draftContentToPlainText,
} from "@/domain/draft/model/draft.service"
import type { DraftContent, DraftDetail } from "@/domain/draft"
import type { VersionDetail } from "@/features/writing/sync/types"

function extractTitle(text: string | null) {
  return normalizeDraftTitle(text ?? "")
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

type UseEditorDraftOptions = {
  draftDetail: DraftDetail | undefined
  draftId: number
}

export function useEditorDraft({
  draftDetail,
  draftId,
}: UseEditorDraftOptions) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const lastSyncedSnapshotRef = useRef<string | null>(null)
  const [lastSyncedSnapshot, setLastSyncedSnapshot] = useState<string | null>(
    null
  )
  const initializedForDraftIdRef = useRef<number | null>(null)

  const [editorDraft, setEditorDraft, editorDraftRef] =
    useRefState<EditorDraftSnapshot>(createEmptyEditorDraftSnapshot())

  useEffect(() => {
    if (!draftDetail || initializedForDraftIdRef.current === draftId) return
    initializedForDraftIdRef.current = draftId

    const redirectSnapshot = consumeRedirectDraftSnapshot(draftId)
    const nextEditorDraft =
      redirectSnapshot?.editorDraft ??
      createDraftSnapshotFromDetail(draftDetail)

    setEditorDraft(nextEditorDraft)

    const synced =
      redirectSnapshot?.lastSyncedSnapshot ??
      serializeDraftSnapshot(nextEditorDraft)
    lastSyncedSnapshotRef.current = synced
    startTransition(() => setLastSyncedSnapshot(synced))

    if (titleRef.current) {
      titleRef.current.textContent = nextEditorDraft.title
    }
  }, [draftDetail, draftId, setEditorDraft])

  const handleTitleInput = useCallback(
    (event: FormEvent<HTMLHeadingElement>) => {
      setEditorDraft(
        createEditorDraftSnapshot({
          content: editorDraftRef.current.content,
          title: extractTitle(event.currentTarget.textContent),
        })
      )
    },
    [editorDraftRef, setEditorDraft]
  )

  const handleContentChange = useCallback(
    (nextContent: DraftContent) => {
      setEditorDraft(
        createEditorDraftSnapshot({
          content: nextContent,
          title: editorDraftRef.current.title,
        })
      )
    },
    [editorDraftRef, setEditorDraft]
  )

  const getContent = useCallback(() => {
    return {
      bodyHtml: draftContentToHtml(editorDraftRef.current.content),
      bodyText: draftContentToPlainText(editorDraftRef.current.content),
      title: editorDraftRef.current.title,
    }
  }, [editorDraftRef])

  const markSynced = useCallback((snapshot: EditorDraftSnapshot) => {
    const serialized = serializeDraftSnapshot(snapshot)
    lastSyncedSnapshotRef.current = serialized
    setLastSyncedSnapshot(serialized)
  }, [])

  const restoreFromVersion = useCallback(
    (detail: VersionDetail) => {
      const nextEditorDraft = createEditorDraftSnapshot({
        content: detail.content,
        title: detail.title,
      })

      setEditorDraft(nextEditorDraft)

      const synced = serializeDraftSnapshot(nextEditorDraft)
      lastSyncedSnapshotRef.current = synced
      setLastSyncedSnapshot(synced)

      if (titleRef.current) {
        titleRef.current.textContent = detail.title
      }
    },
    [setEditorDraft]
  )

  const serializedEditorDraft = serializeDraftSnapshot(editorDraft)
  const hasPendingChanges =
    serializedEditorDraft !== lastSyncedSnapshot && draftDetail !== undefined

  return {
    editorDraft,
    editorDraftRef,
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
