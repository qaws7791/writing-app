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
  createPhaseOneRepository,
  type PhaseOneRepository,
} from "@/lib/phase-one-repository"
import {
  consumeRedirectDraftSnapshot,
  createDraftSnapshotFromDetail,
  createEditorDraftSnapshot,
  createEmptyEditorDraftSnapshot,
  type DraftSyncState,
  type EditorDraftSnapshot,
  hasMeaningfulDraftInput,
  normalizeDraftTitle,
  persistRedirectDraftSnapshot,
  serializeDraftSnapshot,
} from "@/lib/phase-one-draft-sync"
import {
  type FlushPendingDraftResult,
  useEditorLeaveGuard,
} from "@/hooks/use-editor-leave-guard"
import {
  draftContentToHtml,
  draftContentToPlainText,
} from "@/lib/phase-one-rich-text"
import type {
  DraftContent,
  DraftDetail,
  PromptDetail,
} from "@/lib/phase-one-types"

type CreateDraftState = "created" | "creating" | "idle" | "retry-pending"
type CreateDraftFromSnapshotOptions = {
  skipRouteReplace?: boolean
}

export type WritingNewPageClientProps = {
  draftId?: number
  initialPromptId?: number | null
}

function extractTitle(text: string | null) {
  return normalizeDraftTitle(text ?? "")
}

export function useWritingNewPage({
  draftId,
  initialPromptId = null,
}: WritingNewPageClientProps) {
  const pathname = usePathname()
  const repository = useMemo<PhaseOneRepository>(
    () => createPhaseOneRepository(),
    []
  )
  const router = useRouter()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const isMountedRef = useRef(true)
  const createStateRef = useRef<CreateDraftState>(draftId ? "created" : "idle")
  const createPromiseRef = useRef<Promise<DraftDetail | null> | null>(null)
  const flushPromiseRef = useRef<Promise<FlushPendingDraftResult> | null>(null)
  const lastSyncedSnapshotRef = useRef<string | null>(null)
  const pendingRouteReplaceRef = useRef<number | null>(null)
  const skipCanonicalRouteReplaceRef = useRef(false)
  const editorDraftRef = useRef<EditorDraftSnapshot>(
    createEmptyEditorDraftSnapshot()
  )
  const persistedDraftRef = useRef<DraftDetail | null>(null)
  const promptRef = useRef<PromptDetail | null>(null)

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
    promptRef.current = nextPrompt
    setPromptState(nextPrompt)
  }

  const createDraftFromSnapshot = useCallback(
    async (
      snapshot: EditorDraftSnapshot,
      options: CreateDraftFromSnapshotOptions = {}
    ) => {
      if (options.skipRouteReplace) {
        skipCanonicalRouteReplaceRef.current = true
      }

      if (
        draftId ||
        persistedDraftRef.current !== null ||
        createStateRef.current === "created" ||
        !hasMeaningfulDraftInput(snapshot)
      ) {
        return persistedDraftRef.current
      }

      if (createPromiseRef.current) {
        return createPromiseRef.current
      }

      createStateRef.current = "creating"
      setSyncState("creating")

      const serializedSnapshot = serializeDraftSnapshot(snapshot)

      const createPromise = (async () => {
        try {
          const createdDraft = await repository.createDraft({
            content: snapshot.content,
            sourcePromptId: initialPromptId ?? undefined,
            title: snapshot.title,
          })
          const shouldSkipRouteReplace =
            options.skipRouteReplace || skipCanonicalRouteReplaceRef.current

          createStateRef.current = "created"
          lastSyncedSnapshotRef.current = serializedSnapshot

          if (isMountedRef.current) {
            setPersistedDraft(createdDraft)
            setSyncState("saved")
          } else {
            persistedDraftRef.current = createdDraft
          }

          if (!shouldSkipRouteReplace) {
            if (
              serializeDraftSnapshot(editorDraftRef.current) ===
              serializedSnapshot
            ) {
              persistRedirectDraftSnapshot(createdDraft.id, {
                editorDraft: editorDraftRef.current,
                lastSyncedSnapshot: serializedSnapshot,
              })
              router.replace(`/write/${createdDraft.id}`)
            } else {
              pendingRouteReplaceRef.current = createdDraft.id
            }
          } else {
            pendingRouteReplaceRef.current = null
          }

          return createdDraft
        } catch {
          createStateRef.current = "retry-pending"

          if (isMountedRef.current) {
            setSyncState("error")
          }

          return null
        } finally {
          createPromiseRef.current = null
        }
      })()

      createPromiseRef.current = createPromise

      return createPromise
    },
    [draftId, initialPromptId, repository, router]
  )

  const flushPendingDraft =
    useCallback(async (): Promise<FlushPendingDraftResult> => {
      if (flushPromiseRef.current) {
        return flushPromiseRef.current
      }

      const flushPromise = (async (): Promise<FlushPendingDraftResult> => {
        if (loading) {
          return "blocked"
        }

        let createdDuringFlush = false
        const currentEditorDraft = editorDraftRef.current
        const hasMeaningfulInput = hasMeaningfulDraftInput(currentEditorDraft)

        if (!persistedDraftRef.current) {
          if (!hasMeaningfulInput) {
            return "noop"
          }

          const createdDraft = await createDraftFromSnapshot(
            currentEditorDraft,
            {
              skipRouteReplace: true,
            }
          )

          if (!createdDraft) {
            return "blocked"
          }

          createdDuringFlush = true
        }

        const currentPersistedDraft = persistedDraftRef.current
        if (!currentPersistedDraft) {
          return hasMeaningfulInput ? "blocked" : "noop"
        }

        const snapshotToSync = editorDraftRef.current
        const serializedSnapshot = serializeDraftSnapshot(snapshotToSync)

        if (serializedSnapshot === lastSyncedSnapshotRef.current) {
          return createdDuringFlush ? "saved" : "noop"
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

          if (pendingRouteReplaceRef.current === result.draft.id) {
            pendingRouteReplaceRef.current = null
            persistRedirectDraftSnapshot(result.draft.id, {
              editorDraft: snapshotToSync,
              lastSyncedSnapshot: serializedSnapshot,
            })
            router.replace(`/write/${result.draft.id}`)
          }

          return "saved"
        } catch {
          if (isMountedRef.current) {
            setSyncState("error")
          }

          return "blocked"
        } finally {
          flushPromiseRef.current = null
        }
      })()

      flushPromiseRef.current = flushPromise

      return flushPromise
    }, [createDraftFromSnapshot, loading, repository, router])

  const serializedEditorDraft = serializeDraftSnapshot(editorDraft)
  const hasPendingChanges =
    ((serializedEditorDraft !== lastSyncedSnapshotRef.current &&
      hasMeaningfulDraftInput(editorDraft)) ||
      syncState === "creating" ||
      syncState === "saving" ||
      syncState === "error" ||
      (createStateRef.current === "retry-pending" &&
        hasMeaningfulDraftInput(editorDraft))) &&
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
        skipCanonicalRouteReplaceRef.current = false

        if (draftId) {
          const currentPersistedDraft = persistedDraftRef.current
          if (currentPersistedDraft?.id === draftId) {
            if (
              currentPersistedDraft.sourcePromptId !== null &&
              promptRef.current === null
            ) {
              const linkedPrompt = await repository.getPrompt(
                currentPersistedDraft.sourcePromptId
              )

              if (cancelled) {
                return
              }

              setPrompt(linkedPrompt)
            }

            setLoadError(null)
            setSyncState((current) => (current === "idle" ? "saved" : current))
            return
          }

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
          createStateRef.current = "created"
          lastSyncedSnapshotRef.current =
            redirectDraftSnapshot?.lastSyncedSnapshot ??
            serializeDraftSnapshot(nextEditorDraft)
          setSyncState("saved")

          if (titleRef.current) {
            titleRef.current.textContent = nextEditorDraft.title
          }

          return
        }

        const linkedPrompt =
          initialPromptId !== null
            ? await repository.getPrompt(initialPromptId)
            : null

        if (cancelled) {
          return
        }

        setPrompt(linkedPrompt)
        setLoadError(null)

        if (persistedDraftRef.current !== null) {
          setPersistedDraft(null)
          createStateRef.current = "idle"
          lastSyncedSnapshotRef.current = null
          setSyncState("idle")
          setEditorDraft(createEmptyEditorDraftSnapshot())
          if (titleRef.current) {
            titleRef.current.textContent = ""
          }
          return
        }

        if (
          createStateRef.current === "idle" &&
          !hasMeaningfulDraftInput(editorDraftRef.current)
        ) {
          lastSyncedSnapshotRef.current = null
          setSyncState("idle")
          setEditorDraft(createEmptyEditorDraftSnapshot())
          if (titleRef.current) {
            titleRef.current.textContent = ""
          }
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
  }, [draftId, initialPromptId, repository])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void flushPendingDraft()
    }, 3000)

    return () => {
      window.clearInterval(timer)
    }
  }, [flushPendingDraft])

  function maybeCreateDraft(snapshot: EditorDraftSnapshot) {
    if (
      draftId ||
      persistedDraftRef.current !== null ||
      createStateRef.current !== "idle"
    ) {
      return
    }

    if (!hasMeaningfulDraftInput(snapshot)) {
      return
    }

    void createDraftFromSnapshot(snapshot)
  }

  function handleTitleInput(event: FormEvent<HTMLHeadingElement>) {
    const nextEditorDraft = createEditorDraftSnapshot({
      content: editorDraftRef.current.content,
      title: extractTitle(event.currentTarget.textContent),
    })

    setEditorDraft(nextEditorDraft)
    maybeCreateDraft(nextEditorDraft)
  }

  function handleContentChange(nextContent: DraftContent) {
    const nextEditorDraft = createEditorDraftSnapshot({
      content: nextContent,
      title: editorDraftRef.current.title,
    })

    setEditorDraft(nextEditorDraft)
    maybeCreateDraft(nextEditorDraft)
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
