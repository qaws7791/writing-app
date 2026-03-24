"use client"

import type { ReactNode } from "react"
import {
  ReplaceIcon,
  SearchAreaIcon,
  TextWrapIcon,
  FlowConnectionIcon,
  PulseRectangle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { AIFeatureType } from "@/features/ai-assistant/repositories/mock-ai"

// --- 타입 ---

export type FeatureButtonData = {
  label: string
  description: string
  icon: ReactNode
}

export type AIFeatureOption = FeatureButtonData & {
  type: AIFeatureType
}

export type Layer2Option = {
  id: "spelling-review" | "flow-review"
  label: string
  description: string
  icon: ReactNode
}

// --- 데이터 ---

export const layer1Features: AIFeatureOption[] = [
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

export const layer2Options: Layer2Option[] = [
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

// --- 컴포넌트 ---

export function FeatureButton({
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
