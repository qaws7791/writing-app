"use client"

import CharacterCount from "@tiptap/extension-character-count"
import Document from "@tiptap/extension-document"
import History from "@tiptap/extension-history"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Text from "@tiptap/extension-text"
import Typography from "@tiptap/extension-typography"
import { Redo02Icon, Undo02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type Editor, EditorContent, useEditor } from "@tiptap/react"
import {
  type MouseEvent,
  type ReactNode,
  startTransition,
  useEffect,
  useState,
} from "react"

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@workspace/ui/components/toolbar"
import { cn } from "@workspace/ui/lib/utils"

import styles from "./writing-body-editor.module.css"

type WritingBodyEditorProps = {
  placeholder?: string
}

type EditorSnapshot = {
  canRedo: boolean
  canUndo: boolean
  characters: number
  words: number
}

type CharacterCountStorage = {
  characters: () => number
  words: () => number
}

type ToolbarActionButtonProps = {
  active?: boolean
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
}

const initialEditorSnapshot: EditorSnapshot = {
  canRedo: false,
  canUndo: false,
  characters: 0,
  words: 0,
}

function keepEditorSelection(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function createEditorSnapshot(editor: Editor): EditorSnapshot {
  const characterCount = editor.storage.characterCount as
    | CharacterCountStorage
    | undefined

  return {
    canRedo: editor.can().chain().focus().redo().run(),
    canUndo: editor.can().chain().focus().undo().run(),
    characters: characterCount?.characters() ?? 0,
    words: characterCount?.words() ?? 0,
  }
}

function ToolbarActionButton({
  active = false,
  ariaLabel,
  children,
  disabled = false,
  onClick,
  title,
}: ToolbarActionButtonProps) {
  return (
    <ToolbarButton
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      aria-pressed={active}
      data-active={active}
      disabled={disabled}
      title={title}
      className={cn(
        "min-w-8 rounded-[12px] px-2 text-[13px] font-medium text-[#5F5F5F] transition-colors hover:bg-white hover:text-[#111111]",
        active && "bg-white text-[#111111] shadow-sm"
      )}
      onMouseDown={keepEditorSelection}
      onClick={onClick}
    >
      {children}
    </ToolbarButton>
  )
}

function FloatingToolbar({
  editor,
  snapshot,
}: {
  editor: Editor | null
  snapshot: EditorSnapshot
}) {
  const isDisabled = !editor

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <Toolbar
        aria-label="에세이 편집 도구"
        className="pointer-events-auto max-w-[760px] gap-2 overflow-x-auto rounded-[24px] border border-[#E5E5E5] bg-white/92 px-1.5 py-1.5 shadow-[0_18px_45px_rgba(17,17,17,0.12)] backdrop-blur-xl"
      >
        <ToolbarGroup className="shrink-0 rounded-[16px] bg-[#F5F5F5] p-0.5">
          <ToolbarActionButton
            ariaLabel="실행 취소"
            disabled={!snapshot.canUndo}
            title="실행 취소"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <HugeiconsIcon
              icon={Undo02Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.8}
            />
          </ToolbarActionButton>
          <ToolbarActionButton
            ariaLabel="다시 실행"
            disabled={!snapshot.canRedo}
            title="다시 실행"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <HugeiconsIcon
              icon={Redo02Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.8}
            />
          </ToolbarActionButton>
        </ToolbarGroup>

        <ToolbarSeparator />

        <div className="flex shrink-0 items-center gap-2 px-2 text-[12px] font-medium whitespace-nowrap text-[#5F5F5F]">
          <span>{snapshot.characters.toLocaleString("ko-KR")}자</span>
          <span className="text-[#D6D6D6]">/</span>
          <span>{snapshot.words.toLocaleString("ko-KR")}단어</span>
        </div>
      </Toolbar>
    </div>
  )
}

export default function WritingBodyEditor({
  placeholder = "생각이 흐르는 대로 자유롭게 적어보세요...",
}: WritingBodyEditorProps) {
  const resolvedPlaceholder =
    placeholder ?? "생각이 흐르는 대로 자유롭게 적어보세요..."
  const editorClassName = styles.editor ?? ""
  const editorShellClassName = styles.editorShell ?? ""
  const [snapshot, setSnapshot] = useState(initialEditorSnapshot)

  const editor = useEditor({
    extensions: [
      Document,
      History,
      Paragraph,
      Text,
      Typography,
      CharacterCount,
      Placeholder.configure({
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
        placeholder: resolvedPlaceholder,
        showOnlyCurrent: false,
      }),
    ],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const updateSnapshot = () => {
      startTransition(() => {
        setSnapshot(createEditorSnapshot(editor))
      })
    }

    updateSnapshot()
    editor.on("transaction", updateSnapshot)

    return () => {
      editor.off("transaction", updateSnapshot)
    }
  }, [editor])

  return (
    <>
      {editor ? (
        <EditorContent editor={editor} className={editorShellClassName} />
      ) : (
        <div className={editorShellClassName} />
      )}
      <FloatingToolbar editor={editor} snapshot={snapshot} />
    </>
  )
}
