"use client"

import CharacterCount from "@tiptap/extension-character-count"
import Document from "@tiptap/extension-document"
import History from "@tiptap/extension-history"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Text from "@tiptap/extension-text"
import Typography from "@tiptap/extension-typography"
import {
  Redo02Icon,
  SparklesIcon,
  Undo02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type Editor, EditorContent, useEditor } from "@tiptap/react"
import {
  type MouseEvent,
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@workspace/ui/components/toolbar"
import { cn } from "@workspace/ui/lib/utils"

import {
  type AIFeatureType,
  type AISuggestion,
  type ReviewItem,
  getAISuggestions,
  getDocumentReview,
  getFlowReview,
} from "@/lib/mock-ai"
import {
  AIReviewExtension,
  clearReviewItems,
  getReviewItems,
  removeReviewItem,
  setReviewItems,
} from "@/components/ai/ai-review-extension"
import {
  AIBottomSheet,
  type AISheetMode,
} from "@/components/ai/ai-bottom-sheet"
import { AIReviewCard } from "@/components/ai/ai-review-card"

import styles from "./writing-body-editor.module.css"

// --- 타입 ---

type WritingBodyEditorProps = {
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

type ToolbarActionButtonProps = {
  active?: boolean
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
  className?: string
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

function keepEditorSelection(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

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

function getParagraphs(
  editor: Editor
): { from: number; to: number; text: string }[] {
  const paragraphs: { from: number; to: number; text: string }[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "paragraph" && node.textContent.trim().length > 0) {
      paragraphs.push({
        from: pos + 1,
        to: pos + node.nodeSize - 1,
        text: node.textContent,
      })
    }
  })
  return paragraphs
}

// --- 서브 컴포넌트 ---

function ToolbarActionButton({
  active = false,
  ariaLabel,
  children,
  disabled = false,
  onClick,
  title,
  className: extraClassName,
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
        active && "bg-white text-[#111111] shadow-sm",
        extraClassName
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
  isReviewMode,
  onAIClick,
  onEndReview,
}: {
  editor: Editor | null
  snapshot: EditorSnapshot
  isReviewMode: boolean
  onAIClick: () => void
  onEndReview: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <Toolbar
        aria-label="에세이 편집 도구"
        className="pointer-events-auto max-w-[760px] gap-2 overflow-x-auto rounded-[24px] border border-[#E5E5E5] bg-white/92 px-1.5 py-1.5 shadow-[0_18px_45px_rgba(17,17,17,0.12)] backdrop-blur-xl"
      >
        {isReviewMode ? (
          <>
            <div className="flex items-center gap-2 px-3 text-[13px] font-medium text-primary">
              <HugeiconsIcon
                icon={SparklesIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
              />
              <span>검토 중</span>
            </div>
            <ToolbarSeparator />
            <ToolbarActionButton
              ariaLabel="검토 종료"
              title="검토 종료"
              onClick={onEndReview}
              className="gap-1 text-muted-foreground"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
              <span className="text-[12px]">종료</span>
            </ToolbarActionButton>
          </>
        ) : (
          <>
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

            <ToolbarSeparator />

            {/* AI 버튼 */}
            <ToolbarActionButton
              ariaLabel="AI 글쓰기 도우미"
              title="AI 도우미"
              onClick={onAIClick}
              className={cn(
                "gap-1.5 transition-all",
                snapshot.hasSelection &&
                  "bg-primary/10 text-primary ring-1 ring-primary/30 hover:bg-primary/15 hover:text-primary"
              )}
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
                className={cn(snapshot.hasSelection && "animate-pulse")}
              />
              <span className="text-[12px]">AI</span>
            </ToolbarActionButton>
          </>
        )}
      </Toolbar>
    </div>
  )
}

// --- 메인 컴포넌트 ---

export default function WritingBodyEditor({
  placeholder = "생각이 흐르는 대로 자유롭게 적어보세요...",
}: WritingBodyEditorProps) {
  const resolvedPlaceholder =
    placeholder ?? "생각이 흐르는 대로 자유롭게 적어보세요..."
  const editorClassName = styles.editor ?? ""
  const editorShellClassName = styles.editorShell ?? ""

  const [snapshot, setSnapshot] = useState(initialEditorSnapshot)

  // AI 상태
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<AISheetMode>("layer1-features")
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [activeReviewItem, setActiveReviewItem] = useState<ReviewItem | null>(
    null
  )

  // AI 버튼 클릭 시 선택 상태를 저장
  const savedSelectionRef = useRef({
    text: "",
    from: 0,
    to: 0,
  })

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
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
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

  // 리뷰 모드에서 하이라이트 클릭 감지
  useEffect(() => {
    if (!editor || !isReviewMode) return

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement
      const reviewEl = target.closest("[data-review-id]") as HTMLElement | null
      if (reviewEl) {
        const id = reviewEl.getAttribute("data-review-id")
        const items = getReviewItems(editor)
        const item = items.find((i) => i.id === id)
        if (item) {
          setActiveReviewItem(item)
        }
      }
    }

    editor.view.dom.addEventListener("click", handleClick)
    return () => {
      editor.view.dom.removeEventListener("click", handleClick)
    }
  }, [editor, isReviewMode])

  // --- AI 핸들러 ---

  const handleAIClick = useCallback(() => {
    if (!editor) return

    savedSelectionRef.current = {
      text: snapshot.selectedText,
      from: snapshot.selectionFrom,
      to: snapshot.selectionTo,
    }

    if (snapshot.hasSelection) {
      setSheetMode("layer1-features")
    } else {
      setSheetMode("layer2-options")
    }
    setSuggestions([])
    setSheetOpen(true)
  }, [editor, snapshot])

  const handleSelectFeature = useCallback(
    async (type: AIFeatureType) => {
      if (!editor) return

      setSheetMode("layer1-loading")

      try {
        const result = await getAISuggestions(
          savedSelectionRef.current.text,
          type
        )
        setSuggestions(result)
        setSheetMode("layer1-suggestions")
      } catch {
        setSheetOpen(false)
      }
    },
    [editor]
  )

  const handleAcceptSuggestion = useCallback(
    (suggestion: AISuggestion) => {
      if (!editor) return

      const { from, to } = savedSelectionRef.current
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, suggestion.suggestion)
        .run()

      setSheetOpen(false)
      setSuggestions([])
    },
    [editor]
  )

  const handleSelectLayer2Option = useCallback(
    async (id: "spelling-review" | "flow-review") => {
      if (!editor) return

      setSheetMode("layer2-loading")

      try {
        const paragraphs = getParagraphs(editor)
        const items =
          id === "spelling-review"
            ? await getDocumentReview(paragraphs)
            : await getFlowReview(paragraphs)

        setReviewItems(editor, items)
        setIsReviewMode(true)
        setSheetOpen(false)
      } catch {
        setSheetOpen(false)
      }
    },
    [editor]
  )

  const handleEndReview = useCallback(() => {
    if (!editor) return
    clearReviewItems(editor)
    setIsReviewMode(false)
    setActiveReviewItem(null)
  }, [editor])

  const handleAcceptReviewItem = useCallback(() => {
    if (!editor || !activeReviewItem) return

    if (activeReviewItem.suggestion && activeReviewItem.type !== "flow") {
      editor
        .chain()
        .focus()
        .deleteRange({
          from: activeReviewItem.from,
          to: activeReviewItem.to,
        })
        .insertContentAt(activeReviewItem.from, activeReviewItem.suggestion)
        .run()
    }

    removeReviewItem(editor, activeReviewItem.id)
    setActiveReviewItem(null)

    const remaining = getReviewItems(editor)
    if (remaining.length === 0) {
      setIsReviewMode(false)
    }
  }, [editor, activeReviewItem])

  const handleRejectReviewItem = useCallback(() => {
    if (!editor || !activeReviewItem) return
    removeReviewItem(editor, activeReviewItem.id)
    setActiveReviewItem(null)

    const remaining = getReviewItems(editor)
    if (remaining.length === 0) {
      setIsReviewMode(false)
    }
  }, [editor, activeReviewItem])

  const handleDismissReviewCard = useCallback(() => {
    setActiveReviewItem(null)
  }, [])

  // 리뷰 아이템 인덱스 계산
  const reviewItems = editor ? getReviewItems(editor) : []
  const activeReviewIndex = activeReviewItem
    ? reviewItems.findIndex((i) => i.id === activeReviewItem.id)
    : -1

  return (
    <>
      {editor ? (
        <EditorContent editor={editor} className={editorShellClassName} />
      ) : (
        <div className={editorShellClassName} />
      )}

      {/* 리뷰 모드: 리뷰 아이템 카드 (툴바 위에 표시) */}
      {isReviewMode && activeReviewItem && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[72px] z-30 flex justify-center px-4">
          <AIReviewCard
            item={activeReviewItem}
            totalCount={reviewItems.length}
            currentIndex={activeReviewIndex}
            onAccept={handleAcceptReviewItem}
            onReject={handleRejectReviewItem}
            onDismiss={handleDismissReviewCard}
          />
        </div>
      )}

      <FloatingToolbar
        editor={editor}
        snapshot={snapshot}
        isReviewMode={isReviewMode}
        onAIClick={handleAIClick}
        onEndReview={handleEndReview}
      />

      <AIBottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        selectedText={savedSelectionRef.current.text}
        suggestions={suggestions}
        onSelectFeature={handleSelectFeature}
        onAcceptSuggestion={handleAcceptSuggestion}
        onSelectLayer2Option={handleSelectLayer2Option}
      />
    </>
  )
}
