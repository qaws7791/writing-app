"use client"

import {
  SparklesIcon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"

import type { AISuggestion } from "@workspace/core/modules/ai-assistant"

// --- 서브 컴포넌트 ---

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="relative flex size-10 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <HugeiconsIcon
          icon={SparklesIcon}
          size={22}
          className="animate-pulse text-primary"
        />
      </div>
      <p className="text-sm text-muted-foreground">AI가 분석 중입니다...</p>
    </div>
  )
}

function SuggestionCard({
  suggestion,
  index,
  onAccept,
}: {
  suggestion: AISuggestion
  index: number
  onAccept: () => void
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">제안 {index + 1}</p>
        <Button size="sm" onClick={onAccept} className="gap-1.5">
          <HugeiconsIcon
            icon={Tick02Icon}
            size={14}
            color="currentColor"
            strokeWidth={2}
          />
          적용
        </Button>
      </div>
      <p className="text-sm leading-relaxed break-all whitespace-pre-wrap text-foreground md:text-base">
        {suggestion.suggestion}
      </p>
      <p className="mt-2 text-sm leading-snug wrap-break-word whitespace-pre-wrap text-muted-foreground">
        {suggestion.reason}
      </p>
    </div>
  )
}

// --- 메인 컴포넌트 ---

type AISuggestionPanelProps = {
  isLoading: boolean
  selectedText: string
  suggestions: AISuggestion[]
  onAcceptSuggestion: (suggestion: AISuggestion) => void
  onClose: () => void
}

export function AISuggestionPanel({
  isLoading,
  selectedText,
  suggestions,
  onAcceptSuggestion,
  onClose,
}: AISuggestionPanelProps) {
  const visibleSuggestions = suggestions.slice(0, 3)

  return (
    <div
      data-ai-suggestion-panel=""
      className="flex h-[50svh] flex-none flex-col border-t border-border/60 bg-background md:h-full md:w-[50%] md:min-w-0 md:border-t-0 md:border-l"
    >
      {/* 헤더 */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-5 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <HugeiconsIcon
            icon={SparklesIcon}
            size={18}
            className="text-primary"
          />
          AI 글쓰기 도우미
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="제안 패널 닫기"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {selectedText && (
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-sm text-muted-foreground">원문</p>
                <p className="mt-1 text-sm leading-relaxed break-all whitespace-pre-wrap text-foreground/80">
                  {selectedText}
                </p>
              </div>
            )}

            {visibleSuggestions.map((suggestion, i) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                index={i}
                onAccept={() => onAcceptSuggestion(suggestion)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
