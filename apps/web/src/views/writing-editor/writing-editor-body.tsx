"use client"

import { EditorContent } from "@tiptap/react"
import type { Editor } from "@tiptap/react"
import { Lightbulb } from "lucide-react"

import {
  PromptBanner,
  PromptBannerSkeleton,
} from "@/features/writings/components"

export function WritingEditorBody({
  dateLabel,
  editor,
  handleTitleChange,
  isPromptLoading,
  onOpenPromptSheet,
  onTogglePromptCollapsed,
  prompt,
  promptCollapsed,
  title,
  titleRef,
  wordCount,
  writingIdNumber,
}: {
  dateLabel: string
  editor: Editor | null
  handleTitleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  isPromptLoading: boolean
  onOpenPromptSheet: () => void
  onTogglePromptCollapsed: () => void
  prompt: { body: string; title: string } | null
  promptCollapsed: boolean
  title: string
  titleRef: React.RefObject<HTMLTextAreaElement | null>
  wordCount: number
  writingIdNumber?: number
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-16">
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
            onToggle={onTogglePromptCollapsed}
          />
        </div>
      )}
      {!prompt && !isPromptLoading && wordCount === 0 && !writingIdNumber && (
        <div className="pt-6">
          <button
            type="button"
            onClick={onOpenPromptSheet}
            className="flex w-full items-center gap-3 rounded-2xl bg-muted px-5 py-4 text-left transition-colors hover:bg-accent"
          >
            <Lightbulb
              size={20}
              strokeWidth={1.5}
              className="shrink-0 text-muted-foreground"
            />
            <span className="text-sm leading-6 text-muted-foreground">
              아이디어가 필요하신가요?
            </span>
          </button>
        </div>
      )}
      <section className="flex flex-col gap-2 pt-6">
        <p className="text-sm leading-5 font-medium text-muted-foreground/80">
          {dateLabel}
        </p>
        <textarea
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="제목"
          rows={1}
          className="w-full resize-none overflow-hidden bg-transparent text-3xl leading-tight font-semibold text-foreground outline-none placeholder:text-muted-foreground/80"
        />
      </section>

      <div className="writing-editor mt-12">
        <EditorContent editor={editor} />
      </div>

      <p className="mt-6 text-right text-sm leading-5 font-medium text-muted-foreground/80">
        {wordCount} 단어
      </p>
    </div>
  )
}
