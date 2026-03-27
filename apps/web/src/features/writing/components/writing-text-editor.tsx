"use client"

import CharacterCount from "@tiptap/extension-character-count"
import Document from "@tiptap/extension-document"
import History from "@tiptap/extension-history"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Text from "@tiptap/extension-text"
import Typography from "@tiptap/extension-typography"
import { type Editor, EditorContent, useEditor } from "@tiptap/react"
import { startTransition, useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { AIReviewExtension } from "@/features/ai-assistant/components/ai-review-extension"
import { AIReviewCard } from "@/features/ai-assistant/components/ai-review-card"
import { AISuggestionPanel } from "@/features/ai-assistant/components/ai-suggestion-panel"
import type { WritingContent } from "@/domain/writing"
import {
  createEmptyWritingContent,
  parseWritingContent,
  writingContentJsonCodec,
} from "@/domain/writing"

import { useAISplit } from "@/features/writing/context/ai-split-context"
import { useAISuggestion } from "@/features/writing/hooks/use-ai-suggestion"
import { useAIReview } from "@/features/writing/hooks/use-ai-review"
import { FloatingToolbar } from "@/features/writing/components/floating-toolbar"

import styles from "./writing-text-editor.module.css"

// --- 타입 ---

type WritingTextEditorProps = {
  initialContent?: WritingContent
  onContentChange?: (content: WritingContent) => void
  placeholder?: string
}

type EditorSnapshot = {
  canRedo: boolean
  canUndo: boolean
  characters: number
  words: number
  hasSelection: boolean
  selectedText: string
  selectionFrom: number
  selectionTo: number
}

type CharacterCountStorage = {
  characters: () => number
  words: () => number
}

// --- 상수 ---

const initialEditorSnapshot: EditorSnapshot = {
  canRedo: false,
  canUndo: false,
  characters: 0,
  words: 0,
  hasSelection: false,
  selectedText: "",
  selectionFrom: 0,
  selectionTo: 0,
}

// --- 유틸리티 ---

function createEditorSnapshot(editor: Editor): EditorSnapshot {
  const characterCount = editor.storage.characterCount as
    | CharacterCountStorage
    | undefined

  const { from, to } = editor.state.selection
  const hasSelection = from !== to
  const selectedText = hasSelection
    ? editor.state.doc.textBetween(from, to, " ")
    : ""

  return {
    canRedo: editor.can().chain().focus().redo().run(),
    canUndo: editor.can().chain().focus().undo().run(),
    characters: characterCount?.characters() ?? 0,
    words: characterCount?.words() ?? 0,
    hasSelection,
    selectedText,
    selectionFrom: from,
    selectionTo: to,
  }
}

// --- 메인 컴포넌트 ---

export default function WritingTextEditor({
  initialContent,
  onContentChange,
  placeholder = "생각이 흐르는 대로 자유롭게 적어보세요...",
}: WritingTextEditorProps) {
  const resolvedPlaceholder =
    placeholder ?? "생각이 흐르는 대로 자유롭게 적어보세요..."
  const editorClassName = styles.editor ?? ""
  const editorShellClassName = styles.editorShell ?? ""
  const serializedInitialContent = writingContentJsonCodec.encode(
    initialContent ?? createEmptyWritingContent()
  )

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
      AIReviewExtension,
    ],
    content: initialContent ?? createEmptyWritingContent(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
    onUpdate({ editor: currentEditor }) {
      onContentChange?.(parseWritingContent(currentEditor.getJSON()))
    },
  })

  // 스냅샷 업데이트
  useEffect(() => {
    if (!editor) return

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

  useEffect(() => {
    if (!editor) return

    if (
      writingContentJsonCodec.encode(parseWritingContent(editor.getJSON())) ===
      serializedInitialContent
    ) {
      return
    }

    editor.commands.setContent(
      writingContentJsonCodec.decode(serializedInitialContent),
      {
        emitUpdate: false,
      }
    )
  }, [editor, serializedInitialContent])

  // AI 훅
  const suggestion = useAISuggestion({ editor, snapshot })
  const { panelContainer } = useAISplit()
  const review = useAIReview({
    editor,
    onClearSelectedText: suggestion.clearSelectedText,
  })

  return (
    <>
      {editor ? (
        <div data-writing-body>
          <EditorContent editor={editor} className={editorShellClassName} />
        </div>
      ) : (
        <div className={editorShellClassName} />
      )}

      {/* 리뷰 모드: 리뷰 아이템 카드 (툴바 위에 표시) */}
      {review.isReviewMode && review.activeReviewItem && (
        <div className="pointer-events-none fixed inset-x-0 bottom-18 z-30 flex justify-center px-4">
          <AIReviewCard
            item={review.activeReviewItem}
            totalCount={review.reviewItems.length}
            currentIndex={review.activeReviewIndex}
            onAccept={review.handleAcceptReviewItem}
            onReject={review.handleRejectReviewItem}
            onDismiss={review.handleDismissReviewCard}
          />
        </div>
      )}

      <FloatingToolbar
        editor={editor}
        snapshot={snapshot}
        isReviewMode={review.isReviewMode}
        isSuggestionMode={suggestion.isSuggestionMode}
        expandedMode={suggestion.toolbarExpanded}
        onAIClick={suggestion.handleAIClick}
        onEndReview={review.handleEndReview}
        onSelectFeature={suggestion.handleSelectFeature}
        onSelectLayer2Option={review.handleSelectLayer2Option}
        onCollapseToolbar={suggestion.handleCollapseToolbar}
      />

      {suggestion.isSuggestionMode &&
        panelContainer &&
        createPortal(
          <AISuggestionPanel
            isLoading={suggestion.isSuggestionLoading}
            selectedText={suggestion.selectedText}
            suggestions={suggestion.suggestions}
            onAcceptSuggestion={suggestion.handleAcceptSuggestion}
            onClose={suggestion.handleCloseSuggestionPanel}
          />,
          panelContainer
        )}
    </>
  )
}
