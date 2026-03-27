import { type MouseEvent, type ReactNode, useEffect, useRef } from "react"
import {
  Redo02Icon,
  SparklesIcon,
  Undo02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Editor } from "@tiptap/react"

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@workspace/ui/components/toolbar"
import { cn } from "@workspace/ui/lib/utils"

import type { AIFeatureType } from "@workspace/core/modules/ai-assistant"
import {
  FeatureButton,
  layer1Features,
  layer2Options,
} from "@/features/ai-assistant/components/ai-features"

// --- 타입 ---

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

type ToolbarExpandedMode = "layer1-features" | "layer2-options" | null

type ToolbarActionButtonProps = {
  active?: boolean
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
  className?: string
}

type FloatingToolbarProps = {
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
}

// --- 유틸리티 ---

function keepEditorSelection(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
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

// --- 메인 컴포넌트 ---

export function FloatingToolbar({
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
}: FloatingToolbarProps) {
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
            ? "max-h-100 scale-100 opacity-100"
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
