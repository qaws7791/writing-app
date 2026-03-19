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
import { createPortal } from "react-dom"

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
import { AIReviewCard } from "@/components/ai/ai-review-card"
import {
  FeatureButton,
  layer1Features,
  layer2Options,
} from "@/components/ai/ai-features"
import { AISuggestionPanel } from "@/components/ai/ai-suggestion-panel"
import type { DraftContent } from "@/lib/phase-one-types"
import { createEmptyDraftContent } from "@/lib/phase-one-rich-text"

import styles from "./writing-body-editor.module.css"

// --- 타입 ---

type WritingBodyEditorProps = {
  initialContent?: DraftContent
  onContentChange?: (content: DraftContent) => void
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

type ToolbarExpandedMode = "layer1-features" | "layer2-options" | null

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

function scrollEditorSelectionIntoView(
  editor: Editor,
  selection?: { from: number; to: number }
) {
  if (selection && (selection.from !== 0 || selection.to !== 0)) {
    editor.chain().setTextSelection(selection).scrollIntoView().run()
    return
  }

  editor.commands.scrollIntoView()
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
        "min-w-8 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
        active && "bg-card text-foreground shadow-sm",
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
  isSuggestionMode,
  expandedMode,
  onAIClick,
  onEndReview,
  onSelectFeature,
  onSelectLayer2Option,
  onCollapseToolbar,
}: {
  editor: Editor | null
  snapshot: EditorSnapshot
  isReviewMode: boolean
  isSuggestionMode: boolean
  expandedMode: ToolbarExpandedMode
  onAIClick: () => void
  onEndReview: () => void
  onSelectFeature: (type: AIFeatureType) => void
  onSelectLayer2Option: (id: "spelling-review" | "flow-review") => void
  onCollapseToolbar: () => void
}) {
  const expandedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expandedMode) return

    function handleClickOutside(e: globalThis.MouseEvent) {
      if (
        expandedRef.current &&
        !expandedRef.current.contains(e.target as Node)
      ) {
        onCollapseToolbar()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [expandedMode, onCollapseToolbar])

  if (isSuggestionMode) return null

  return (
    <div
      ref={expandedRef}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex flex-col items-center px-4"
    >
      {/* 확장 영역: 기능 선택 버튼들 */}
      <div
        className={cn(
          "pointer-events-auto mb-2 w-full max-w-3xl origin-bottom overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-xl transition-all duration-300 ease-in-out",
          expandedMode
            ? "max-h-[400px] scale-100 opacity-100"
            : "max-h-0 scale-95 border-transparent opacity-0"
        )}
      >
        <div className="px-2 py-2">
          {expandedMode === "layer1-features" &&
            layer1Features.map((feature) => (
              <FeatureButton
                key={feature.type}
                feature={feature}
                onClick={() => onSelectFeature(feature.type)}
              />
            ))}
          {expandedMode === "layer2-options" &&
            layer2Options.map((option) => (
              <FeatureButton
                key={option.id}
                feature={option}
                onClick={() => onSelectLayer2Option(option.id)}
              />
            ))}
        </div>
      </div>

      {/* 메인 툴바 */}
      <Toolbar
        aria-label="에세이 편집 도구"
        className="pointer-events-auto max-w-3xl gap-2 overflow-x-auto rounded-2xl border border-border bg-background/95 px-1.5 py-1.5 shadow-xl backdrop-blur-xl"
      >
        {isReviewMode ? (
          <>
            <div className="flex items-center gap-2 px-3 text-sm font-medium text-primary">
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
              <span className="text-xs">종료</span>
            </ToolbarActionButton>
          </>
        ) : (
          <>
            <ToolbarGroup className="shrink-0 rounded-lg bg-muted p-0.5">
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

            <div className="flex shrink-0 items-center gap-2 px-2 text-xs font-medium whitespace-nowrap text-muted-foreground">
              <span>{snapshot.characters.toLocaleString("ko-KR")}자</span>
              <span className="text-border">/</span>
              <span>{snapshot.words.toLocaleString("ko-KR")}단어</span>
            </div>

            <ToolbarSeparator />

            <ToolbarActionButton
              ariaLabel="AI 글쓰기 도우미"
              title="AI 도우미"
              onClick={onAIClick}
              className={cn(
                "gap-1.5 transition-all",
                (snapshot.hasSelection || expandedMode) &&
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
              <span className="text-xs">AI</span>
            </ToolbarActionButton>
          </>
        )}
      </Toolbar>
    </div>
  )
}

// --- 메인 컴포넌트 ---

export default function WritingBodyEditor({
  initialContent,
  onContentChange,
  placeholder = "생각이 흐르는 대로 자유롭게 적어보세요...",
}: WritingBodyEditorProps) {
  const resolvedPlaceholder =
    placeholder ?? "생각이 흐르는 대로 자유롭게 적어보세요..."
  const editorClassName = styles.editor ?? ""
  const editorShellClassName = styles.editorShell ?? ""
  const serializedInitialContent = JSON.stringify(
    initialContent ?? createEmptyDraftContent()
  )

  const [snapshot, setSnapshot] = useState(initialEditorSnapshot)

  // AI 상태
  const [toolbarExpanded, setToolbarExpanded] =
    useState<ToolbarExpandedMode>(null)
  const [isSuggestionMode, setIsSuggestionMode] = useState(false)
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [activeReviewItem, setActiveReviewItem] = useState<ReviewItem | null>(
    null
  )

  const savedSelectionRef = useRef({
    text: "",
    from: 0,
    to: 0,
  })
  const previousSuggestionModeRef = useRef(isSuggestionMode)

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
    content: initialContent ?? createEmptyDraftContent(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
    onUpdate({ editor: currentEditor }) {
      onContentChange?.(currentEditor.getJSON() as DraftContent)
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

    const nextContent = JSON.parse(serializedInitialContent) as DraftContent
    const currentContent = editor.getJSON() as DraftContent

    if (JSON.stringify(currentContent) === serializedInitialContent) {
      return
    }

    editor.commands.setContent(nextContent, { emitUpdate: false })
  }, [editor, serializedInitialContent])

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

  // 분할 뷰 data attribute 관리
  useEffect(() => {
    if (isSuggestionMode) {
      document.documentElement.setAttribute("data-ai-split", "")
    } else {
      document.documentElement.removeAttribute("data-ai-split")
    }
    return () => {
      document.documentElement.removeAttribute("data-ai-split")
    }
  }, [isSuggestionMode])

  useEffect(() => {
    if (!editor) return
    if (previousSuggestionModeRef.current === isSuggestionMode) return

    previousSuggestionModeRef.current = isSuggestionMode

    let nestedFrame = 0
    const frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        if (isSuggestionMode) {
          scrollEditorSelectionIntoView(editor, savedSelectionRef.current)
          return
        }

        scrollEditorSelectionIntoView(editor, {
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(nestedFrame)
    }
  }, [editor, isSuggestionMode])

  // --- AI 핸들러 ---

  const handleAIClick = useCallback(() => {
    if (!editor) return

    savedSelectionRef.current = {
      text: snapshot.selectedText,
      from: snapshot.selectionFrom,
      to: snapshot.selectionTo,
    }
    setSelectedText(snapshot.selectedText)

    if (toolbarExpanded) {
      setToolbarExpanded(null)
      return
    }

    if (snapshot.hasSelection) {
      setToolbarExpanded("layer1-features")
    } else {
      setToolbarExpanded("layer2-options")
    }
    setSuggestions([])
  }, [editor, snapshot, toolbarExpanded])

  const handleCollapseToolbar = useCallback(() => {
    setToolbarExpanded(null)
  }, [])

  const handleSelectFeature = useCallback(
    async (type: AIFeatureType) => {
      if (!editor) return

      setToolbarExpanded(null)
      setIsSuggestionMode(true)
      setIsSuggestionLoading(true)
      setSuggestions([])

      try {
        const result = await getAISuggestions(
          savedSelectionRef.current.text,
          type
        )
        setSuggestions(result)
      } catch {
        setIsSuggestionMode(false)
      } finally {
        setIsSuggestionLoading(false)
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

      setIsSuggestionMode(false)
      setSelectedText("")
      setSuggestions([])
    },
    [editor]
  )

  const handleCloseSuggestionPanel = useCallback(() => {
    setIsSuggestionMode(false)
    setSelectedText("")
    setSuggestions([])
  }, [])

  const handleSelectLayer2Option = useCallback(
    async (id: "spelling-review" | "flow-review") => {
      if (!editor) return

      setToolbarExpanded(null)

      try {
        const paragraphs = getParagraphs(editor)
        const items =
          id === "spelling-review"
            ? await getDocumentReview(paragraphs)
            : await getFlowReview(paragraphs)

        setReviewItems(editor, items)
        setIsReviewMode(true)
        setSelectedText("")
      } catch {
        /* noop */
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

  const reviewItems = editor ? getReviewItems(editor) : []
  const activeReviewIndex = activeReviewItem
    ? reviewItems.findIndex((i) => i.id === activeReviewItem.id)
    : -1

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
      {isReviewMode && activeReviewItem && (
        <div className="pointer-events-none fixed inset-x-0 bottom-18 z-30 flex justify-center px-4">
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
        isSuggestionMode={isSuggestionMode}
        expandedMode={toolbarExpanded}
        onAIClick={handleAIClick}
        onEndReview={handleEndReview}
        onSelectFeature={handleSelectFeature}
        onSelectLayer2Option={handleSelectLayer2Option}
        onCollapseToolbar={handleCollapseToolbar}
      />

      {isSuggestionMode &&
        createPortal(
          <AISuggestionPanel
            isLoading={isSuggestionLoading}
            selectedText={selectedText}
            suggestions={suggestions}
            onAcceptSuggestion={handleAcceptSuggestion}
            onClose={handleCloseSuggestionPanel}
          />,
          document.body
        )}
    </>
  )
}
