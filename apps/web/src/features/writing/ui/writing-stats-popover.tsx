"use client"

import type { ReactNode } from "react"
import {
  CheckIcon,
  SparklesIcon,
  WarningIcon,
} from "@workspace/ui/components/icons"
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
  align = "center",
  children,
  metrics,
  minChars,
  side = "bottom",
  sideOffset = 8,
  triggerClassName,
}: {
  readonly align?: "start" | "center" | "end"
  readonly children: ReactNode
  readonly metrics: KoreanWritingMetrics
  readonly minChars?: number
  readonly side?: "top" | "bottom" | "left" | "right"
  readonly sideOffset?: number
  readonly triggerClassName?: string
}) {
  const meetsMin =
    minChars === undefined || metrics.charCountWithSpaces >= minChars

  return (
    <Popover>
      <PopoverTrigger
        aria-label="집필 현황 및 가독성 통계 보기"
        className={
          triggerClassName ??
          "inline-flex items-center rounded-full px-2 py-0.5 text-left cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        }
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-80 p-4 gap-3.5"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverHeader className="pb-0">
          <PopoverTitle className="text-sm font-semibold">
            집필 통계
          </PopoverTitle>
        </PopoverHeader>

        <div className="flex flex-col gap-3">
          {/* Material You Hero Card */}
          <div className="rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {minChars !== undefined ? (
                meetsMin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px] font-medium tracking-tight text-primary-foreground">
                    <CheckIcon className="size-3" />
                    목표 달성
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[11px] font-medium tracking-tight text-primary-foreground/90">
                    진행 중
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px] font-medium tracking-tight text-primary-foreground">
                  <SparklesIcon className="size-3" />
                  작성 현황
                </span>
              )}
              {minChars !== undefined ? (
                <span className="text-[11px] font-medium text-primary-foreground/80">
                  최소 {minChars.toLocaleString("ko-KR")}자
                </span>
              ) : null}
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.charCountWithSpaces.toLocaleString("ko-KR")}자
              </div>
              <p className="mt-0.5 text-xs text-primary-foreground/85">
                {minChars !== undefined
                  ? meetsMin
                    ? metrics.charCountWithSpaces > minChars
                      ? `최소 목표를 ${(metrics.charCountWithSpaces - minChars).toLocaleString("ko-KR")}자 초과했어요`
                      : "최소 분량 목표를 달성했어요"
                    : `최소 목표까지 ${(minChars - metrics.charCountWithSpaces).toLocaleString("ko-KR")}자 남았어요`
                  : `공백 포함 ${metrics.charCountWithSpaces.toLocaleString("ko-KR")}자 작성 중이에요`}
              </p>
            </div>
          </div>

          {/* Unified Single Surface Metrics Container */}
          <div className="rounded-2xl border border-border/50 bg-muted/40 p-3.5 flex flex-col">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-muted-foreground">
                  어절 수
                </span>
                <span className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
                  {metrics.eojeolCount.toLocaleString("ko-KR")}개
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-muted-foreground">
                  공백 제외
                </span>
                <span className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
                  {metrics.charCountWithoutSpaces.toLocaleString("ko-KR")}자
                </span>
              </div>
            </div>

            <div className="my-2.5 h-px bg-border/40" />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-muted-foreground">
                  문단 구성
                </span>
                <span className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
                  {metrics.paragraphCount.toLocaleString("ko-KR")}개
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    (평균 {metrics.avgParagraphLength}자)
                  </span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-muted-foreground">
                  예상 읽기 시간
                </span>
                <span className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
                  약 {metrics.estimatedReadTimeMinutes}분
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Writing Insight Chip */}
          <WritingInsightBanner metrics={metrics} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function WritingInsightBanner({
  metrics,
}: {
  readonly metrics: KoreanWritingMetrics
}) {
  if (metrics.longSentenceCount > 0) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <WarningIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold leading-tight">
            긴 문장 {metrics.longSentenceCount}개
          </span>
          <span className="text-[11px] font-medium leading-relaxed">
            100자가 넘는 문장이 있어요. 두 문장으로 나눠보는 걸 추천해요.
          </span>
        </div>
      </div>
    )
  }

  if (metrics.paragraphCount === 1 && metrics.charCountWithSpaces >= 300) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <WarningIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold leading-tight">문단 구분 권장</span>
          <span className="text-[11px] font-medium leading-relaxed">
            한 문단이 길어져 가독성이 떨어질 수 있어요. 문단을 나눠보세요.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
      <SparklesIcon className="size-3.5 shrink-0 text-primary" />
      <span className="text-[11px] font-medium leading-relaxed">
        {metrics.charCountWithSpaces === 0
          ? "글을 작성하면 실시간 통계가 표시돼요."
          : `평균 문장 길이 ${metrics.avgSentenceLength}자로 읽기 편한 호흡이에요.`}
      </span>
    </div>
  )
}
