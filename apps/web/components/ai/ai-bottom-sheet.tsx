"use client"

import type { ReactNode } from "react"
import {
  Cancel01Icon,
  ReplaceIcon,
  SearchAreaIcon,
  SparklesIcon,
  TextWrapIcon,
  Tick02Icon,
  FlowConnectionIcon,
  PulseRectangle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

import type { AIFeatureType, AISuggestion } from "@/lib/mock-ai"

// --- Layer 1: 기능 선택 + 제안 ---

type FeatureButtonData = {
  label: string
  description: string
  icon: ReactNode
}

type AIFeatureOption = FeatureButtonData & {
  type: AIFeatureType
}

const layer1Features: AIFeatureOption[] = [
  {
    type: "vocabulary",
    label: "어휘 & 표현 개선",
    description: "더 정확하거나 자연스러운 대안을 제안합니다",
    icon: (
      <HugeiconsIcon
        icon={ReplaceIcon}
        size={20}
        color="currentColor"
        strokeWidth={1.6}
      />
    ),
  },
  {
    type: "clarity",
    label: "문장 명료화",
    description: "모호한 표현을 짚고 더 명확한 문장을 제안합니다",
    icon: (
      <HugeiconsIcon
        icon={SearchAreaIcon}
        size={20}
        color="currentColor"
        strokeWidth={1.6}
      />
    ),
  },
  {
    type: "rhythm",
    label: "문장 호흡 조정",
    description: "문장의 길이와 리듬을 조절합니다",
    icon: (
      <HugeiconsIcon
        icon={PulseRectangle02Icon}
        size={20}
        color="currentColor"
        strokeWidth={1.6}
      />
    ),
  },
]

// --- Layer 2: 전체 검토 옵션 ---

type Layer2Option = {
  id: "spelling-review" | "flow-review"
  label: string
  description: string
  icon: ReactNode
}

const layer2Options: Layer2Option[] = [
  {
    id: "spelling-review",
    label: "전체 맞춤법 & 중복 검토",
    description: "맞춤법, 띄어쓰기, 반복 표현을 일괄 검토합니다",
    icon: (
      <HugeiconsIcon
        icon={TextWrapIcon}
        size={20}
        color="currentColor"
        strokeWidth={1.6}
      />
    ),
  },
  {
    id: "flow-review",
    label: "문단 연결 흐름 피드백",
    description: "문단 간 논리 연결이 끊기는 지점을 표시합니다",
    icon: (
      <HugeiconsIcon
        icon={FlowConnectionIcon}
        size={20}
        color="currentColor"
        strokeWidth={1.6}
      />
    ),
  },
]

// --- Props ---

export type AISheetMode =
  | "layer1-features"
  | "layer1-loading"
  | "layer1-suggestions"
  | "layer2-options"
  | "layer2-loading"

type AIBottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: AISheetMode
  selectedText: string
  suggestions: AISuggestion[]
  onSelectFeature: (type: AIFeatureType) => void
  onAcceptSuggestion: (suggestion: AISuggestion) => void
  onSelectLayer2Option: (id: "spelling-review" | "flow-review") => void
}

function FeatureButton({
  feature,
  onClick,
}: {
  feature: FeatureButtonData
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-muted/60 active:bg-muted"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground/70">
        {feature.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground md:text-base">
          {feature.label}
        </p>
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
          {feature.description}
        </p>
      </div>
    </button>
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
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          제안 {index + 1}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-foreground md:text-base">
        {suggestion.suggestion}
      </p>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">
        {suggestion.reason}
      </p>
      <div className="mt-3 flex items-center gap-2">
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
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
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

export function AIBottomSheet({
  open,
  onOpenChange,
  mode,
  selectedText,
  suggestions,
  onSelectFeature,
  onAcceptSuggestion,
  onSelectLayer2Option,
}: AIBottomSheetProps) {
  const isLayer1 = mode.startsWith("layer1")
  const isLoading = mode === "layer1-loading" || mode === "layer2-loading"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={18}
              className="text-primary"
            />
            {isLayer1 ? "AI 글쓰기 도우미" : "전체 문서 검토"}
          </DrawerTitle>
          {isLayer1 && selectedText && mode === "layer1-features" && (
            <DrawerDescription className="mt-1 line-clamp-2 text-sm">
              선택한 텍스트: &ldquo;{selectedText.slice(0, 80)}
              {selectedText.length > 80 ? "..." : ""}&rdquo;
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div className="sheet-body-scroll overflow-y-auto px-4 pb-6">
          {/* Layer 1: 기능 선택 */}
          {mode === "layer1-features" && (
            <div className="flex flex-col gap-1">
              {layer1Features.map((feature) => (
                <FeatureButton
                  key={feature.type}
                  feature={feature}
                  onClick={() => onSelectFeature(feature.type)}
                />
              ))}
            </div>
          )}

          {/* 로딩 */}
          {isLoading && <LoadingState />}

          {/* Layer 1: 제안 */}
          {mode === "layer1-suggestions" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  원문
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {selectedText}
                </p>
              </div>
              {suggestions.map((suggestion, i) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={i}
                  onAccept={() => onAcceptSuggestion(suggestion)}
                />
              ))}
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 text-muted-foreground"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  원문 유지
                </Button>
              </DrawerClose>
            </div>
          )}

          {/* Layer 2: 검토 옵션 */}
          {mode === "layer2-options" && (
            <div className="flex flex-col gap-1">
              {layer2Options.map((option) => (
                <FeatureButton
                  key={option.id}
                  feature={option}
                  onClick={() => onSelectLayer2Option(option.id)}
                />
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
