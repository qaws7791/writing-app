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

  const [draft, setDraft] = useState<DraftDetail | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<DraftContent>({
    content: [{ type: "paragraph" }],
    type: "doc",
  })
  const [prompt, setPrompt] = useState<PromptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<
    "error" | "idle" | "saved" | "saving"
  >("idle")
  const [saveVersion, setSaveVersion] = useState(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [versionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDraft() {
      try {
        const nextDraft = draftId
          ? await repository.getDraft(draftId)
          : await repository.createDraft({
              sourcePromptId: initialPromptId ?? undefined,
            })

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
        if (titleRef.current) {
          titleRef.current.textContent = nextDraft.title
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
    const draftId = draft?.id

    if (!draftId || saveVersion === 0) {
      return
    }

    setSaveState("saving")
    const timer = window.setTimeout(() => {
      void repository
        .autosaveDraft(draftId, {
          content,
          title,
        })
        .then((result) => {
          setDraft(result.draft)
          setSaveState("saved")
        })
        .catch(() => {
          setSaveState("error")
        })
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [content, draft?.id, repository, saveVersion, title])

  function bumpSaveVersion() {
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
