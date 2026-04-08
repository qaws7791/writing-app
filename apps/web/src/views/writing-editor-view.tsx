"use client"

import { useCallback, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
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
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

import { usePromptDetail } from "@/features/prompts/hooks/use-prompt-detail"

function PromptBanner({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-secondary-container px-5 py-4">
      <p className="text-xs font-semibold tracking-widest text-on-surface-low uppercase">
        오늘의 글감
      </p>
      <h2 className="text-lg leading-snug font-semibold tracking-tight text-on-surface">
        {title}
      </h2>
      <p className="text-sm leading-relaxed text-on-surface-low">{body}</p>
    </section>
  )
}

function PromptBannerSkeleton() {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-secondary-container px-5 py-4">
      <div className="h-3 w-16 animate-pulse rounded bg-on-surface/10" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-on-surface/10" />
      <div className="h-4 w-full animate-pulse rounded bg-on-surface/10" />
    </section>
  )
}

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
    immediatelyRender: false,
  })

  const wordCount = editor?.storage.characterCount.words() ?? 0

  const promptQuery = usePromptDetail(promptId)
  const isPromptEnabled = promptId != null
  const prompt =
    isPromptEnabled && promptQuery.data != null ? promptQuery.data : null
  const isPromptLoading = isPromptEnabled && promptQuery.isLoading

  const handleTitleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    setTitle(el.value)
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  const handleSave = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface px-4 py-3">
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>

        <span className="flex-1 truncate px-2 text-center text-sm font-semibold text-on-surface">
          {title || "새 글"}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="더보기"
            className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
          >
            <HugeiconsIcon
              icon={MoreVerticalIcon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
          <button
            type="button"
            aria-label="저장"
            onClick={handleSave}
            className="flex size-10 items-center justify-center rounded-full bg-on-surface text-on-primary transition-colors hover:opacity-90"
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              size={24}
              color="currentColor"
              strokeWidth={2}
            />
          </button>
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
            <PromptBanner title={prompt.title} body={prompt.body} />
          </div>
        )}
        {/* Date + Title block */}
        <section className="flex flex-col gap-2 pt-6">
          <p className="text-sm font-medium tracking-[0.022rem] text-on-surface-lowest">
            {formatKoreanDate(today)}
          </p>
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onInput={handleTitleInput}
            placeholder="제목"
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-[2rem] leading-normal font-medium tracking-[-0.0625em] text-on-surface outline-none placeholder:text-on-surface-lowest"
          />
        </section>

        {/* Body editor */}
        <div className="writing-editor mt-12">
          <EditorContent editor={editor} />
        </div>

        {/* Word count */}
        <p className="mt-6 text-right text-sm text-on-surface-lowest">
          {wordCount} 단어
        </p>
      </div>
    </div>
  )
}
