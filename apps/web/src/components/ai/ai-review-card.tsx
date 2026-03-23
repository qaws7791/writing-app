"use client"

import {
  Cancel01Icon,
  Tick02Icon,
  Alert01Icon,
  FlowConnectionIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"

import type { ReviewItem } from "@/lib/mock-ai"

const typeConfig: Record<
  ReviewItem["type"],
  { label: string; badgeClass: string }
> = {
  spelling: {
    label: "맞춤법",
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  duplicate: {
    label: "중복 표현",
    badgeClass: "border-warning/20 bg-warning/10 text-warning",
  },
  flow: {
    label: "흐름",
    badgeClass: "border-info/20 bg-info/10 text-info",
  },
}

type AIReviewCardProps = {
  item: ReviewItem
  totalCount: number
  currentIndex: number
  onAccept: () => void
  onReject: () => void
  onDismiss: () => void
}

export function AIReviewCard({
  item,
  totalCount,
  currentIndex,
  onAccept,
  onReject,
  onDismiss,
}: AIReviewCardProps) {
  const config = typeConfig[item.type]
  const isFlowType = item.type === "flow"

  return (
    <div className="pointer-events-auto w-full max-w-3xl animate-in duration-200 fade-in-0 slide-in-from-bottom-2">
      <div className="rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur-xl">
        {/* 헤더 */}
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}
            >
              <HugeiconsIcon
                icon={isFlowType ? FlowConnectionIcon : Alert01Icon}
                size={12}
                color="currentColor"
                strokeWidth={2}
              />
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {totalCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={16}
              color="currentColor"
              strokeWidth={2}
            />
          </button>
        </div>

        {/* 원문 & 제안 */}
        {item.suggestion && !isFlowType && (
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
              {item.original}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="rounded-md bg-success/10 px-1.5 py-0.5 font-medium text-success">
              {item.suggestion}
            </span>
          </div>
        )}

        {/* 사유 */}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.reason}
        </p>

        {/* 액션 */}
        <div className="mt-3 flex items-center gap-2">
          {isFlowType ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onDismiss}
              className="gap-1.5"
            >
              확인
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={onAccept} className="gap-1.5">
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={2}
                />
                수락
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onReject}
                className="gap-1.5 text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={2}
                />
                거절
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
