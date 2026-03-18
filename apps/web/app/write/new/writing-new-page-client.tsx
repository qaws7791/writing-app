"use client"

import {
  type FormEvent,
  useCallback,
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

function useWritingContent(containerRef: React.RefObject<HTMLElement | null>) {
  return useCallback(() => {
    const container = containerRef.current
    if (!container) {
      return { title: "", bodyHtml: "", bodyText: "" }
    }

    const titleEl = container.querySelector("h1")
    const bodyEl = container.querySelector("[data-writing-body] .ProseMirror")

    const title = titleEl?.textContent?.trim() ?? ""
    const bodyHtml = bodyEl?.innerHTML ?? ""
    const bodyText = bodyEl?.textContent?.trim() ?? ""

    return { title, bodyHtml, bodyText }
  }, [containerRef])
}

export default function WritingNewPageClient() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [versionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const contentRef = useRef<HTMLElement>(null)
  const getContent = useWritingContent(contentRef)

  function handleTitleInput(event: FormEvent<HTMLHeadingElement>) {
    const nextTitle = extractTitle(event.currentTarget.textContent)

    startTransition(() => {
      setTitle(nextTitle)
    })
  }

  async function handleShare() {
    const { title: contentTitle, bodyText } = getContent()
    const text = [contentTitle, bodyText].filter(Boolean).join("\n\n")

    if (!navigator.share) {
      await navigator.clipboard.writeText(text)
      return
    }

    try {
      await navigator.share({
        title: contentTitle || "제목 없음",
        text,
      })
    } catch {
      await navigator.clipboard.writeText(text)
    }
  }

  function handleDelete() {
    router.push("/write")
  }

  return (
    <div
      data-writing-editor-page=""
      className={`${styles.page} flex min-h-0 flex-1 flex-col bg-background text-foreground`}
    >
      <header>
        <div className="pointer-events-auto flex h-16 items-center gap-3 px-4 md:px-6">
          <Link
            aria-label="뒤로 가기"
            href="/write"
            className={`${buttonVariants({
              variant: "outline",
              size: "icon",
            })} shrink-0`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Link>

          <div className="min-w-0 flex-1">
            <p
              aria-live="polite"
              className="min-h-5 truncate text-sm font-medium text-foreground/80 md:text-base"
            >
              {title}
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
                    <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                    파일로 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
                    공유
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setVersionHistoryModalOpen(true)}
                  >
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
                    버전 기록
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center overflow-y-auto px-6 pt-28 pb-40 md:px-10 md:pt-36 md:pb-44">
        <section ref={contentRef} className="w-full max-w-3xl">
          <div className="flex flex-col gap-12">
            <h1
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="에세이 제목"
              data-placeholder="어떤 이야기를 남길까요?"
              className="min-h-18 text-5xl leading-snug font-medium tracking-tight text-foreground outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
              onInput={handleTitleInput}
            />

            <WritingBodyEditor />
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
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>이 글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
