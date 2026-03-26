import type { FormEvent, RefObject } from "react"

import WritingBodyEditor from "@/features/writing/components/writing-body-editor"
import type { EditorDraftSnapshot } from "@/domain/draft/model/draft-sync.service"
import type { DraftContent } from "@/domain/draft"
import type { PromptDetail } from "@/domain/prompt"

type WritingEditorBodyProps = {
  editorDraft: EditorDraftSnapshot
  loadError: string | null
  onContentChange: (nextContent: DraftContent) => void
  onTitleInput: (event: FormEvent<HTMLHeadingElement>) => void
  prompt: PromptDetail | null
  titleRef: RefObject<HTMLHeadingElement | null>
}

export function WritingEditorBody({
  editorDraft,
  loadError,
  onContentChange,
  onTitleInput,
  prompt,
  titleRef,
}: WritingEditorBodyProps) {
  return (
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
            onInput={onTitleInput}
          />

          <WritingBodyEditor
            initialContent={editorDraft.content}
            onContentChange={onContentChange}
          />
        </div>
      </section>
    </main>
  )
}
