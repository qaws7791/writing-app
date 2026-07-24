"use client"

import { cn } from "#ui/lib/utils"
import type { LessonStepCheckedVisual } from "#ui/components/lesson/lesson-step-checked-visual"
import { MarkdownContent } from "#ui/components/lesson/markdown-content"

export function WriteAnswer({
  badge,
  checked = false,
  claim,
  claimLabel,
  goal,
  guide,
  max = 2000,
  min = 20,
  onChange,
  placeholder = "여기에 작성하세요...",
  reference,
  sample,
  structure,
  text = "",
  title,
}: {
  readonly badge?: string
  readonly checked?: LessonStepCheckedVisual
  readonly claim?: string
  readonly claimLabel?: string
  readonly goal?: number
  readonly guide?: string
  readonly max?: number
  readonly min?: number
  readonly onChange?: (text: string) => void
  readonly placeholder?: string
  readonly reference?: string
  readonly sample?: string
  readonly structure?: string
  readonly text?: string
  readonly title: string
}) {
  const minHeight = goal
    ? "min-h-[280px]"
    : claim
      ? "min-h-[200px]"
      : "min-h-[150px]"

  function handleChange(nextText: string) {
    const slicedText = nextText.slice(0, max)
    onChange?.(slicedText)
  }

  return (
    <div className="an-fi">
      <h2
        className="font-bold mb-3"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {title}
      </h2>
      {badge ? (
        <div
          className="inline-block bg-bg-surface text-fg-default font-bold px-4 py-2 rounded-full mb-4"
          style={{ fontSize: "0.875rem" }}
        >
          {badge}
        </div>
      ) : null}
      {claim ? (
        <div className="bg-accent-soft rounded-4xl p-5 mb-4">
          <div
            className="font-bold text-fg-muted mb-2"
            style={{ fontSize: "0.8125rem" }}
          >
            {claimLabel ?? "대상 주장"}
          </div>
          <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
            {claim}
          </p>
        </div>
      ) : null}
      {guide ? (
        <MarkdownContent className="mb-4">{guide}</MarkdownContent>
      ) : null}
      {reference ? (
        <div className="bg-bg-surface rounded-4xl p-5 mb-4 text-fg-muted font-medium">
          <div
            className="font-bold text-fg-muted mb-2"
            style={{ fontSize: "0.8125rem" }}
          >
            참고 원문
          </div>
          {reference}
        </div>
      ) : null}
      {structure ? (
        <div className="bg-bg-surface rounded-4xl p-5 mb-4">
          <div
            className="font-bold text-fg-muted mb-2"
            style={{ fontSize: "0.8125rem" }}
          >
            구조 가이드
          </div>
          <MarkdownContent className="whitespace-pre-line">
            {structure}
          </MarkdownContent>
        </div>
      ) : null}
      <textarea
        className={cn(
          "w-full bg-bg-surface text-fg-default rounded-4xl p-6 font-medium outline-none resize-none",
          minHeight
        )}
        disabled={checked !== false}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        style={{ fontSize: "1.0625rem" }}
        value={text}
      />
      <div
        className="mt-4 flex justify-between items-center text-fg-muted font-bold"
        style={{ fontSize: "0.875rem" }}
      >
        <span>
          {text.length}자 · 최소 {min}
          {goal === undefined ? "" : ` · 목표 ${goal}`}
          {` · 최대 ${max}`}
        </span>
        <span
          className={cn(
            text.length >= min ? "text-success-fg" : "text-danger-fg"
          )}
        >
          {text.length >= min ? "✓" : "✗"}
        </span>
      </div>
      {checked !== false && sample !== undefined ? (
        <div className="mt-6 bg-bg-surface rounded-4xl p-6">
          <div className="font-bold text-fg-muted mb-2">참조 답안</div>
          <p className="font-medium whitespace-pre-line">{sample}</p>
        </div>
      ) : null}
    </div>
  )
}
