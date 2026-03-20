"use client"

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  startTransition,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { createPhaseOneRepository } from "@/lib/phase-one-repository"
import {
  createEmptyDraftContent,
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

function extractTitle(text: string | null) {
  return text?.replace(/\s+/g, " ").trim() ?? ""
}

function hasMeaningfulDraftInput(title: string, content: DraftContent) {
  return title.trim().length > 0 || draftContentToPlainText(content).length > 0
}

type WritingNewPageClientProps = {
  draftId?: number
  initialPromptId?: number | null
}

export default function WritingNewPageClient({
  draftId,
  initialPromptId = null,
}: WritingNewPageClientProps) {
  const repository = useMemo(() => createPhaseOneRepository(), [])
  const router = useRouter()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const lastPersistedVersionRef = useRef(0)
  const hasLocalEditRef = useRef(false)
  const latestInputRef = useRef({
    content: createEmptyDraftContent(),
    title: "",
  })
  const createRequestRef = useRef<Promise<DraftDetail> | null>(null)
  const isMountedRef = useRef(true)

  const [draft, setDraft] = useState<DraftDetail | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<DraftContent>(createEmptyDraftContent)
  const [prompt, setPrompt] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<
    "error" | "idle" | "saved" | "saving"
  >("idle")
  const [saveVersion, setSaveVersion] = useState(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [versionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    latestInputRef.current = {
      content,
      title,
    }
  }, [content, title])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDraft() {
      try {
        if (draftId) {
          const nextDraft = await repository.getDraft(draftId)
          const linkedPrompt =
            nextDraft.sourcePromptId !== null
              ? await repository.getPrompt(nextDraft.sourcePromptId)
              : null

          if (cancelled) {
            return
          }

          setDraft(nextDraft)
          setTitle(nextDraft.title)
          setContent(nextDraft.content)
          setPrompt(linkedPrompt)
          setLoadError(null)
          hasLocalEditRef.current = false
          lastPersistedVersionRef.current = 0
          if (titleRef.current) {
            titleRef.current.textContent = nextDraft.title
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

        setDraft(null)
        setPrompt(linkedPrompt)
        setLoadError(null)
        if (!hasLocalEditRef.current) {
          setTitle("")
          setContent(createEmptyDraftContent())
        }
        lastPersistedVersionRef.current = 0
        if (!hasLocalEditRef.current && titleRef.current) {
          titleRef.current.textContent = ""
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

    void loadDraft()

    return () => {
      cancelled = true
    }
  }, [draftId, initialPromptId, repository])

  useEffect(() => {
    if (loading || saveVersion === 0) {
      return
    }

    if (!draft) {
      if (!hasMeaningfulDraftInput(title, content)) {
        return
      }

      if (
        createRequestRef.current ||
        saveVersion <= lastPersistedVersionRef.current
      ) {
        return
      }

      const createVersion = saveVersion
      setSaveState("saving")

      const createDraftRequest = repository.createDraft({
        content,
        sourcePromptId: initialPromptId ?? undefined,
        title,
      })

      createRequestRef.current = createDraftRequest

      void createDraftRequest
        .then((createdDraft) => {
          if (
            !isMountedRef.current ||
            createRequestRef.current !== createDraftRequest
          ) {
            return
          }

          lastPersistedVersionRef.current = createVersion
          setDraft(createdDraft)
          setSaveState("saved")
          router.replace(`/write/${createdDraft.id}`)
        })
        .catch(() => {
          if (!isMountedRef.current) {
            return
          }

          setSaveState("error")
        })
        .finally(() => {
          if (createRequestRef.current === createDraftRequest) {
            createRequestRef.current = null
          }
        })

      return
    }

    if (saveVersion <= lastPersistedVersionRef.current) {
      return
    }

    const currentDraftId = draft.id
    const versionToPersist = saveVersion

    setSaveState("saving")
    const timer = window.setTimeout(() => {
      void repository
        .autosaveDraft(currentDraftId, {
          content: latestInputRef.current.content,
          title: latestInputRef.current.title,
        })
        .then((result) => {
          if (!isMountedRef.current) {
            return
          }

          lastPersistedVersionRef.current = versionToPersist
          setDraft(result.draft)
          setSaveState("saved")
        })
        .catch(() => {
          if (!isMountedRef.current) {
            return
          }

          setSaveState("error")
        })
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    content,
    draft,
    initialPromptId,
    loading,
    repository,
    router,
    saveVersion,
    title,
  ])

  function bumpSaveVersion() {
    hasLocalEditRef.current = true
    startTransition(() => {
      setSaveVersion((current) => current + 1)
    })
  }

  function handleTitleInput(event: FormEvent<HTMLHeadingElement>) {
    const nextTitle = extractTitle(event.currentTarget.textContent)
    setTitle(nextTitle)
    bumpSaveVersion()
  }

  function handleContentChange(nextContent: DraftContent) {
    setContent(nextContent)
    bumpSaveVersion()
  }

  function getContent() {
    return {
      bodyHtml: draftContentToHtml(content),
      bodyText: draftContentToPlainText(content),
      title,
    }
  }

  async function handleShare() {
    const { bodyText, title: contentTitle } = getContent()
    const text = [contentTitle, bodyText].filter(Boolean).join("\n\n")

    if (!navigator.share) {
      await navigator.clipboard.writeText(text)
      return
    }

    try {
      await navigator.share({
        text,
        title: contentTitle || "제목 없음",
      })
    } catch {
      await navigator.clipboard.writeText(text)
    }
  }

  async function handleDelete() {
    if (draft) {
      await repository.deleteDraft(draft.id)
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
              {title || "새 글"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {saveState === "saving" && "임시 저장 중"}
              {saveState === "saved" &&
                (draft
                  ? `임시 저장됨 · ${formatDraftMeta(draft.lastSavedAt)}`
                  : "임시 저장됨")}
              {saveState === "error" && "저장 지연 중"}
              {saveState === "idle" &&
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
            {loadError && (
              <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
                {loadError}
              </div>
            )}

            {prompt && (
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
            )}

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
              initialContent={content}
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
    </div>
  )
}
