"use client"

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft01Icon,
  Clock01Icon,
  Delete02Icon,
  Download01Icon,
  Share08Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import WritingBodyEditor from "@/components/writing-body-editor"
import { formatDraftMeta } from "@/lib/phase-one-format"
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
import { createPhaseOneRepository } from "@/lib/phase-one-repository"
import {
  draftContentToHtml,
  draftContentToPlainText,
} from "@/lib/phase-one-rich-text"
import type {
  DraftContent,
  DraftDetail,
  PromptDetail,
} from "@/lib/phase-one-types"
import { Button } from "@workspace/ui/components/button"
import { buttonVariants } from "@workspace/ui/components/button.styles"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { WritingExportModal } from "./writing-export-modal"
import { WritingVersionHistoryModal } from "./writing-version-history-modal"

import styles from "../write-editor-page.module.css"

type CreateDraftState = "created" | "creating" | "idle" | "retry-pending"
type CreateDraftFromSnapshotOptions = {
  skipRouteReplace?: boolean
}

type WritingNewPageClientProps = {
  draftId?: number
  initialPromptId?: number | null
}

function extractTitle(text: string | null) {
  return normalizeDraftTitle(text ?? "")
}

export default function WritingNewPageClient({
  draftId,
  initialPromptId = null,
}: WritingNewPageClientProps) {
  const pathname = usePathname()
  const repository = useMemo(() => createPhaseOneRepository(), [])
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

  return (
    <div
      data-writing-editor-page=""
      className={`${styles.page} flex min-h-0 flex-1 flex-col bg-background text-foreground`}
    >
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="pointer-events-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link
            aria-label="뒤로 가기"
            href="/write"
            className={buttonVariants({
              size: "icon",
              variant: "outline",
            })}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} color="currentColor" />
          </Link>

          <div className="min-w-0 flex-1 px-4">
            <p className="truncate text-sm font-medium text-foreground/80 md:text-base">
              {editorDraft.title || "새 글"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {(syncState === "creating" || syncState === "saving") &&
                "임시 저장 중"}
              {syncState === "saved" &&
                (persistedDraft
                  ? `임시 저장됨 · ${formatDraftMeta(persistedDraft.lastSavedAt)}`
                  : "임시 저장됨")}
              {syncState === "error" && "저장 지연 중"}
              {syncState === "idle" &&
                (loading ? "초안 준비 중" : "입력을 시작하면 저장됩니다")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="설정">
                    <HugeiconsIcon
                      icon={Settings02Icon}
                      size={22}
                      color="currentColor"
                      strokeWidth={1.8}
                    />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>글쓰기</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setExportModalOpen(true)}>
                    <HugeiconsIcon
                      icon={Download01Icon}
                      color="currentColor"
                      strokeWidth={2}
                    />
                    파일로 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleShare()}>
                    <HugeiconsIcon
                      icon={Share08Icon}
                      color="currentColor"
                      strokeWidth={2}
                    />
                    공유
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setVersionHistoryModalOpen(true)}
                  >
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      color="currentColor"
                      strokeWidth={2}
                    />
                    버전 기록
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      color="currentColor"
                      strokeWidth={2}
                    />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center overflow-y-auto px-6 pt-28 pb-40 md:px-10 md:pt-36 md:pb-44">
        <section className="w-full max-w-3xl">
          <div className="flex flex-col gap-10">
            {loadError ? (
              <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
                {loadError}
              </div>
            ) : null}

            {prompt ? (
              <div className="rounded-2xl border border-border bg-card px-5 py-4">
                <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  선택한 글감
                </p>
                <h2 className="text-base font-semibold text-foreground">
                  {prompt.text}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {prompt.description}
                </p>
              </div>
            ) : null}

            <h1
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="에세이 제목"
              data-placeholder="어떤 이야기를 남길까요?"
              className="min-h-18 text-5xl leading-snug font-medium tracking-tight text-foreground outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
              onInput={handleTitleInput}
            />

            <WritingBodyEditor
              initialContent={editorDraft.content}
              onContentChange={handleContentChange}
            />
          </div>
        </section>
      </main>

      <WritingExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        getContent={getContent}
      />

      <WritingVersionHistoryModal
        open={versionHistoryModalOpen}
        onOpenChange={setVersionHistoryModalOpen}
        getContent={getContent}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
              <HugeiconsIcon
                icon={Delete02Icon}
                color="currentColor"
                strokeWidth={2}
              />
            </AlertDialogMedia>
            <AlertDialogTitle>이 글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isLeaveConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelPendingNavigation()
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>저장되지 않은 변경이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              지금 나가면 서버에 반영되지 않은 내용이 사라질 수 있습니다. 그래도
              이동할까요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="ghost"
              onClick={cancelPendingNavigation}
            >
              계속 작성
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmPendingNavigation}
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
