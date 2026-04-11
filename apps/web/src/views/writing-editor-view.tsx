"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import type { JSONContent } from "@tiptap/react"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import Bold from "@tiptap/extension-bold"
import History from "@tiptap/extension-history"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import CharacterCount from "@tiptap/extension-character-count"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  MoreVerticalIcon,
  Tick02Icon,
  Delete01Icon,
  Idea01Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { IconButton } from "@workspace/ui/components/icon-button"
import { Button } from "@workspace/ui/components/button"
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@workspace/ui/components/menu"

import { usePromptDetail } from "@/features/prompts/hooks/use-prompt-detail"
import {
  useCreateWriting,
  useDeleteWriting,
  useSaveWriting,
  useWritingDetail,
} from "@/features/writings"
import {
  PromptBanner,
  PromptBannerSkeleton,
} from "@/features/writings/components"
import PromptBottomSheet from "@/views/prompt-bottom-sheet"

function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date)
}

export default function WritingEditorView({
  promptId,
  writingId,
}: {
  promptId?: number
  writingId?: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [today] = useState(() => new Date())
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [promptCollapsed, setPromptCollapsed] = useState(false)
  const [showPromptSheet, setShowPromptSheet] = useState(false)
  const [sheetPromptId, setSheetPromptId] = useState<number | undefined>(
    undefined
  )
  const [wordCount, setWordCount] = useState(0)
  const hasPopulatedRef = useRef(false)
  const isSettingInitialContentRef = useRef(false)

  const writingIdNumber = writingId ? Number(writingId) : undefined
  const effectivePromptId = sheetPromptId ?? promptId

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      History,
      CharacterCount.configure(),
      Placeholder.configure({
        placeholder: "글을 시작하세요.",
      }),
      Typography,
    ],
    onUpdate: ({ editor }) => {
      if (!isSettingInitialContentRef.current) {
        setIsDirty(true)
      }
      setWordCount(editor.storage.characterCount.words())
    },
    immediatelyRender: false,
  })

  const promptQuery = usePromptDetail(effectivePromptId)
  const writingQuery = useWritingDetail(writingIdNumber)
  const createWriting = useCreateWriting()
  const saveWriting = useSaveWriting()
  const deleteWriting = useDeleteWriting()
  const isSaving = createWriting.isPending || saveWriting.isPending

  const isPromptEnabled = effectivePromptId != null
  const prompt =
    isPromptEnabled && promptQuery.data != null ? promptQuery.data : null
  const isPromptLoading = isPromptEnabled && promptQuery.isLoading

  // Populate editor when existing writing data loads
  useEffect(() => {
    if (!editor || !writingQuery.data || hasPopulatedRef.current) return
    hasPopulatedRef.current = true
    const { title: loadedTitle, bodyJson } = writingQuery.data
    startTransition(() => {
      setTitle(loadedTitle)
    })
    if (bodyJson) {
      isSettingInitialContentRef.current = true
      editor.commands.setContent(bodyJson as JSONContent)
      isSettingInitialContentRef.current = false
    }
  }, [editor, writingQuery.data])

  // Warn browser close/refresh when there are unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const performSave = useCallback(async (): Promise<number | undefined> => {
    const bodyJson = editor?.getJSON()
    const bodyPlainText = editor?.getText()
    const words = editor?.storage.characterCount.words() ?? 0

    if (writingIdNumber) {
      await saveWriting.mutateAsync({
        writingId: writingIdNumber,
        title,
        bodyJson,
        bodyPlainText,
        wordCount: words,
      })
      setIsDirty(false)
      return writingIdNumber
    } else {
      const created = await createWriting.mutateAsync({
        title,
        bodyJson,
        bodyPlainText,
        wordCount: words,
        sourcePromptId: effectivePromptId,
      })
      setIsDirty(false)
      return created?.id
    }
  }, [
    editor,
    writingIdNumber,
    title,
    effectivePromptId,
    saveWriting,
    createWriting,
  ])

  const handleSave = useCallback(async () => {
    const writingId = await performSave()
    if (writingId != null) {
      router.push(`/writings/${writingId}`)
    } else {
      router.back()
    }
  }, [performSave, router])

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowLeaveDialog(true)
    } else {
      router.back()
    }
  }, [isDirty, router])

  const handleLeaveWithoutSave = useCallback(() => {
    setShowLeaveDialog(false)
    setIsDirty(false)
    router.back()
  }, [router])

  const handleSaveAndLeave = useCallback(async () => {
    setShowLeaveDialog(false)
    try {
      const savedWritingId = await performSave()
      if (savedWritingId != null) {
        router.push(`/writings/${savedWritingId}`)
      } else {
        router.back()
      }
    } catch {
      // save failed — stay on page
    }
  }, [performSave, router])

  const handleDelete = useCallback(async () => {
    if (!writingIdNumber) return
    await deleteWriting.mutateAsync(writingIdNumber)
    router.replace("/writings")
  }, [writingIdNumber, deleteWriting, router])

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    setTitle(el.value)
    setIsDirty(true)
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface px-4 py-3">
        <IconButton aria-label="뒤로 가기" onClick={handleBack}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </IconButton>

        <span className="flex-1 truncate px-2 text-center text-label-large-em text-on-surface">
          {title || "새 글"}
        </span>

        <div className="flex items-center gap-2">
          {writingIdNumber && (
            <Menu>
              <MenuTrigger>
                <IconButton aria-label="더보기">
                  <HugeiconsIcon
                    icon={MoreVerticalIcon}
                    size={24}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </IconButton>
              </MenuTrigger>
              <MenuContent
                side="bottom"
                align="end"
                className="min-w-32.5 rounded-2xl bg-surface-container-low px-0 py-1 shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)]"
              >
                <MenuItem
                  className="gap-3 px-3 py-3 text-body-medium-em text-on-surface-low"
                  onClick={handleDelete}
                  leadingIcon={
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  }
                >
                  삭제
                </MenuItem>
              </MenuContent>
            </Menu>
          )}
          <IconButton
            aria-label="저장"
            variant="filled"
            onClick={handleSave}
            disabled={isSaving}
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              size={24}
              color="currentColor"
              strokeWidth={2}
            />
          </IconButton>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-16">
        {/* Prompt banner */}
        {isPromptLoading && (
          <div className="pt-6">
            <PromptBannerSkeleton />
          </div>
        )}
        {prompt && (
          <div className="pt-6">
            <PromptBanner
              title={prompt.title}
              body={prompt.body}
              collapsed={promptCollapsed}
              onToggle={() => setPromptCollapsed((v) => !v)}
            />
          </div>
        )}
        {/* "아이디어가 필요하신가요?" button — shown when no prompt and body is empty */}
        {!prompt && !isPromptLoading && wordCount === 0 && !writingIdNumber && (
          <div className="pt-6">
            <button
              type="button"
              onClick={() => setShowPromptSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-container px-5 py-4 text-left transition-colors hover:bg-surface-container-high"
            >
              <HugeiconsIcon
                icon={Idea01Icon}
                size={20}
                color="currentColor"
                strokeWidth={1.5}
                className="shrink-0 text-on-surface-low"
              />
              <span className="text-body-medium text-on-surface-low">
                아이디어가 필요하신가요?
              </span>
            </button>
          </div>
        )}
        {/* Date + Title block */}
        <section className="flex flex-col gap-2 pt-6">
          <p className="text-label-large text-on-surface-lowest">
            {formatKoreanDate(today)}
          </p>
          <textarea
            ref={titleRef}
            value={title}
            onChange={handleTitleChange}
            placeholder="제목"
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-headline-large-em text-on-surface outline-none placeholder:text-on-surface-lowest"
          />
        </section>

        {/* Body editor */}
        <div className="writing-editor mt-12">
          <EditorContent editor={editor} />
        </div>

        {/* Word count */}
        <p className="mt-6 text-right text-label-large text-on-surface-lowest">
          {wordCount} 단어
        </p>
      </div>

      {/* Unsaved changes bottom sheet */}
      <BottomSheet open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <div className="flex flex-col items-center gap-[33px]">
          {/* Icon + text */}
          <div className="flex w-full flex-col items-center gap-[33px]">
            <div className="flex size-[58px] items-center justify-center rounded-[20px] bg-surface">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2V8H20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 13H8M16 17H8M10 9H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-[14px] text-center">
              <p className="text-title-large-em text-on-surface">
                작성 중인 수필이 있어요
              </p>
              <p className="text-body-medium text-on-surface-lowest">
                지금 나가면 저장되지 않은 내용이 사라질 수 있습니다.
                <br />
                저장 후 나가시겠어요?
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-[10px]">
            <Button
              variant="tonal"
              size="lg"
              onClick={handleLeaveWithoutSave}
              className="flex-1"
            >
              그냥 나가기
            </Button>
            <Button
              variant="filled"
              size="lg"
              onClick={handleSaveAndLeave}
              disabled={isSaving}
              loading={isSaving}
              className="flex-1"
            >
              임시 저장 후 나가기
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Prompt selection bottom sheet */}
      <PromptBottomSheet
        open={showPromptSheet}
        onOpenChange={setShowPromptSheet}
        onSelectPrompt={(selectedPromptId) => {
          setSheetPromptId(selectedPromptId)
          setShowPromptSheet(false)
        }}
      />
    </div>
  )
}
