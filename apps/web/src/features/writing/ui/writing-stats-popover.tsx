"use client"

import type { ReactNode } from "react"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/primitives/popover"

export interface KoreanWritingMetrics {
  readonly charCountWithSpaces: number
  readonly charCountWithoutSpaces: number
  readonly eojeolCount: number
  readonly paragraphCount: number
  readonly avgParagraphLength: number
  readonly avgSentenceLength: number
  readonly longSentenceCount: number
  readonly estimatedReadTimeMinutes: number
}

export function calculateKoreanWritingMetrics(
  text: string
): KoreanWritingMetrics {
  const charCountWithSpaces = [...text].length
  const charCountWithoutSpaces = text.replace(/\s/g, "").length
  const trimmed = text.trim()

  const eojeolCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const paragraphCount = paragraphs.length
  const avgParagraphLength =
    paragraphCount === 0 ? 0 : Math.round(charCountWithSpaces / paragraphCount)

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const sentenceCount = sentences.length
  const avgSentenceLength =
    sentenceCount === 0 ? 0 : Math.round(charCountWithSpaces / sentenceCount)
  const longSentenceCount = sentences.filter((s) => [...s].length >= 100).length

  const estimatedReadTimeMinutes =
    charCountWithSpaces === 0
      ? 0
      : Math.max(1, Math.ceil(charCountWithSpaces / 450))

  return {
    avgParagraphLength,
    avgSentenceLength,
    charCountWithoutSpaces,
    charCountWithSpaces,
    eojeolCount,
    estimatedReadTimeMinutes,
    longSentenceCount,
    paragraphCount,
  }
}

export function WritingStatsPopover({
  children,
  metrics,
  minChars,
}: {
  readonly children: ReactNode
  readonly metrics: KoreanWritingMetrics
  readonly minChars?: number
}) {
  const meetsMin =
    minChars === undefined || metrics.charCountWithSpaces >= minChars

  return (
    <Popover>
      <PopoverTrigger
        aria-label="집필 현황 및 가독성 통계 보기"
        className="inline-flex items-center rounded-full px-2 py-0.5 text-left cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 p-4" side="bottom">
        <PopoverHeader className="pb-1">
          <PopoverTitle className="text-sm font-semibold">
            집필 현황 및 한국어 가독성
          </PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>목표 달성도</span>
              <span className="font-medium tabular-nums text-foreground">
                {minChars !== undefined
                  ? `${metrics.charCountWithSpaces.toLocaleString("ko-KR")} / 최소 ${minChars.toLocaleString("ko-KR")}자`
                  : `${metrics.charCountWithSpaces.toLocaleString("ko-KR")}자`}
              </span>
            </div>
            {minChars !== undefined ? (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    meetsMin ? "bg-primary" : "bg-destructive"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((metrics.charCountWithSpaces / minChars) * 100))}%`,
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="어절 수"
              value={`${metrics.eojeolCount.toLocaleString("ko-KR")}어절`}
            />
            <StatCard
              label="공백 제외 글자"
              value={`${metrics.charCountWithoutSpaces.toLocaleString("ko-KR")}자`}
            />
            <StatCard
              label="문단 구성"
              sub={`${metrics.avgParagraphLength}자/문단`}
              value={`${metrics.paragraphCount}개 문단`}
            />
            <StatCard
              label="문장 호흡"
              sub={
                metrics.longSentenceCount > 0
                  ? `긴 문장 ${metrics.longSentenceCount}개`
                  : "적정 호흡"
              }
              value={`평균 ${metrics.avgSentenceLength}자`}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-xs text-muted-foreground border border-border/40">
            <span>예상 소요 읽기 시간</span>
            <span className="font-medium text-foreground tabular-nums">
              약 {metrics.estimatedReadTimeMinutes}분
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StatCard({
  label,
  sub,
  value,
}: {
  readonly label: string
  readonly sub?: string
  readonly value: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-border/50 bg-card p-2.5">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {value}
      </span>
      {sub !== undefined ? (
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      ) : null}
    </div>
  )
}
