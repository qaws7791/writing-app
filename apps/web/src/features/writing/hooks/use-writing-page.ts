"use client"

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  createAppRepository,
  type AppRepository,
} from "@/features/writing/repositories/app-repository"
import {
  consumeRedirectDraftSnapshot,
  createDraftSnapshotFromDetail,
  createEditorDraftSnapshot,
  createEmptyEditorDraftSnapshot,
  type DraftSyncState,
  type EditorDraftSnapshot,
  normalizeDraftTitle,
  serializeDraftSnapshot,
} from "@/domain/draft/model/draft-sync.service"
import {
  type FlushPendingDraftResult,
  useEditorLeaveGuard,
} from "@/features/writing/hooks/use-editor-leave-guard"
import {
  draftContentToHtml,
  draftContentToPlainText,
} from "@/domain/draft/model/draft.service"
import type { DraftContent, DraftDetail } from "@/domain/draft"
import type { PromptDetail } from "@/domain/prompt"

export type WritingPageProps = {
  draftId: number
}

function extractTitle(text: string | null) {
  return normalizeDraftTitle(text ?? "")
}

export function useWritingPage({ draftId }: WritingPageProps) {
  const pathname = usePathname()
  const repository = useMemo<AppRepository>(() => createAppRepository(), [])
  const router = useRouter()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const isMountedRef = useRef(true)
  const lastSyncedSnapshotRef = useRef<string | null>(null)
  const flushPromiseRef = useRef<Promise<FlushPendingDraftResult> | null>(null)
  const editorDraftRef = useRef<EditorDraftSnapshot>(
    createEmptyEditorDraftSnapshot()
  )
  const persistedDraftRef = useRef<DraftDetail | null>(null)

  const [editorDraft, setEditorDraftState] = useState<EditorDraftSnapshot>(
    editorDraftRef.current
  )
  const [persistedDraft, setPersistedDraftState] = useState<DraftDetail | null>(
    null
  )
  const [prompt, setPromptState] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<DraftSyncState>("idle")
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [versionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function setEditorDraft(nextDraft: EditorDraftSnapshot) {
    editorDraftRef.current = nextDraft
    setEditorDraftState(nextDraft)
  }

  function setPersistedDraft(nextDraft: DraftDetail | null) {
    persistedDraftRef.current = nextDraft
    setPersistedDraftState(nextDraft)
  }

  function setPrompt(nextPrompt: PromptDetail | null) {
    setPromptState(nextPrompt)
  }

  const flushPendingDraft =
    useCallback(async (): Promise<FlushPendingDraftResult> => {
      if (flushPromiseRef.current) {
        return flushPromiseRef.current
      }

      const flushPromise = (async (): Promise<FlushPendingDraftResult> => {
        if (loading) {
          return "blocked"
        }

        const currentPersistedDraft = persistedDraftRef.current
        if (!currentPersistedDraft) {
          return "blocked"
        }

        const snapshotToSync = editorDraftRef.current
        const serializedSnapshot = serializeDraftSnapshot(snapshotToSync)

        if (serializedSnapshot === lastSyncedSnapshotRef.current) {
          return "noop"
        }

        setSyncState("saving")

        try {
          const result = await repository.autosaveDraft(
            currentPersistedDraft.id,
            {
              content: snapshotToSync.content,
              title: snapshotToSync.title,
            }
          )

          if (!isMountedRef.current) {
            return "saved"
          }

          lastSyncedSnapshotRef.current = serializedSnapshot
          setPersistedDraft(result.draft)
          setSyncState("saved")

          return "saved"
        } catch {
          if (isMountedRef.current) {
            setSyncState("error")
          }

          return "blocked"
        }
      })()

      flushPromiseRef.current = flushPromise

      // microtask로 정리하여 동기 경로에서도 할당 후 ref가 해제됨
      void flushPromise.finally(() => {
        flushPromiseRef.current = null
      })

      return flushPromise
    }, [loading, repository])

  const serializedEditorDraft = serializeDraftSnapshot(editorDraft)
  const hasPendingChanges =
    serializedEditorDraft !== lastSyncedSnapshotRef.current &&
    (syncState === "saving" ||
      syncState === "error" ||
      persistedDraftRef.current !== null) &&
    !loading

  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    isLeaveConfirmOpen,
  } = useEditorLeaveGuard({
    flushPendingDraft,
    hasPendingChanges,
    navigate: (href) => router.push(href),
    pathname,
  })

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDraft() {
      try {
        const redirectDraftSnapshot = consumeRedirectDraftSnapshot(draftId)
        const nextDraft = await repository.getDraft(draftId)
        const linkedPrompt =
          nextDraft.sourcePromptId !== null
            ? await repository.getPrompt(nextDraft.sourcePromptId)
            : null

        if (cancelled) {
          return
        }

        const nextEditorDraft =
          redirectDraftSnapshot?.editorDraft ??
          createDraftSnapshotFromDetail(nextDraft)

        setPersistedDraft(nextDraft)
        setEditorDraft(nextEditorDraft)
        setPrompt(linkedPrompt)
        setLoadError(null)
        lastSyncedSnapshotRef.current =
          redirectDraftSnapshot?.lastSyncedSnapshot ??
          serializeDraftSnapshot(nextEditorDraft)
        setSyncState("saved")

        if (titleRef.current) {
          titleRef.current.textContent = nextEditorDraft.title
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            "초안을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    setLoading(true)
    void loadDraft()

    return () => {
      cancelled = true
    }
  }, [draftId, repository])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void flushPendingDraft()
    }, 3000)

    return () => {
      window.clearInterval(timer)
    }
  }, [flushPendingDraft])

  function handleTitleInput(event: FormEvent<HTMLHeadingElement>) {
    const nextEditorDraft = createEditorDraftSnapshot({
      content: editorDraftRef.current.content,
      title: extractTitle(event.currentTarget.textContent),
    })

    setEditorDraft(nextEditorDraft)
  }

  function handleContentChange(nextContent: DraftContent) {
    const nextEditorDraft = createEditorDraftSnapshot({
      content: nextContent,
      title: editorDraftRef.current.title,
    })

    setEditorDraft(nextEditorDraft)
  }

  function getContent() {
    return {
      bodyHtml: draftContentToHtml(editorDraft.content),
      bodyText: draftContentToPlainText(editorDraft.content),
      title: editorDraft.title,
    }
  }

  async function handleShare() {
    const { bodyText, title } = getContent()
    const text = [title, bodyText].filter(Boolean).join("\n\n")

    if (!navigator.share) {
      await navigator.clipboard.writeText(text)
      return
    }

    try {
      await navigator.share({
        text,
        title: title || "제목 없음",
      })
    } catch {
      await navigator.clipboard.writeText(text)
    }
  }

  async function handleDelete() {
    const currentPersistedDraft = persistedDraftRef.current

    if (currentPersistedDraft) {
      await repository.deleteDraft(currentPersistedDraft.id)
    }

    router.push("/write")
  }

  return {
    cancelPendingNavigation,
    confirmPendingNavigation,
    deleteDialogOpen,
    editorDraft,
    exportModalOpen,
    getContent,
    handleContentChange,
    handleDelete,
    handleShare,
    handleTitleInput,
    isLeaveConfirmOpen,
    loadError,
    loading,
    persistedDraft,
    prompt,
    setDeleteDialogOpen,
    setExportModalOpen,
    setVersionHistoryModalOpen,
    syncState,
    titleRef,
    versionHistoryModalOpen,
  }
}
