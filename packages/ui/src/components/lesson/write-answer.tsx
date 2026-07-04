"use client"

import { useState, useEffect } from "react"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Surface } from "../ui/surface"
import { Textarea } from "../ui/textarea"
import { cn } from "../../lib/utils"
import type { LessonStepCheckedVisual } from "./lesson-step-checked-visual"
import { MarkdownContent } from "./markdown-content"

export function WriteAnswer({
  badge,
  checked = false,
  claim,
  claimLabel,
  draft = false,
  goal,
  guide,
  initialText = "",
  max = 2000,
  min = 20,
  onChange,
  onDraftSave,
  placeholder = "여기에 작성하세요...",
  reference,
  sample,
  structure,
  title,
}: {
  readonly badge?: string
  readonly checked?: LessonStepCheckedVisual
  readonly claim?: string
  readonly claimLabel?: string
  readonly draft?: boolean
  readonly goal?: number
  readonly guide?: string
  readonly initialText?: string
  readonly max?: number
  readonly min?: number
  readonly onChange?: (text: string) => void
  readonly onDraftSave?: (text: string) => void
  readonly placeholder?: string
  readonly reference?: string
  readonly sample?: string
  readonly structure?: string
  readonly title: string
}) {
  const [text, setText] = useState(initialText)
  const [draftSaved, setDraftSaved] = useState(false)
  const minHeight = goal
    ? "min-h-[280px]"
    : claim
      ? "min-h-[200px]"
      : "min-h-[150px]"

  useEffect(() => {
    if (initialText) {
      onChange?.(initialText)
    }
    // Emit initial draft once on mount when present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(nextText: string) {
    const slicedText = nextText.slice(0, max)
    setText(slicedText)
    onChange?.(slicedText)
  }

  return (
    <div className="an-fi flex flex-col gap-4">
      <h2 className="text-heading-sm font-bold text-foreground">{title}</h2>
      {badge === undefined ? null : (
        <Badge className="w-fit" tone="neutral">
          {badge}
        </Badge>
      )}
      {claim === undefined ? null : (
        <Surface size="md" variant="panel">
          <div className="mb-2 text-label-md font-bold text-muted-foreground">
            {claimLabel ?? "대상 주장"}
          </div>
          <p className="text-body-lg font-medium text-foreground">{claim}</p>
        </Surface>
      )}
      {guide ? (
        <MarkdownContent className="mb-4">{guide}</MarkdownContent>
      ) : null}
      {reference === undefined ? null : (
        <Surface size="md" variant="panel">
          <div className="mb-2 text-label-md font-bold text-muted-foreground">
            참고 원문
          </div>
          <p className="text-body-md leading-relaxed text-foreground whitespace-pre-line">
            {reference}
          </p>
        </Surface>
      )}
      {structure === undefined ? null : (
        <Surface size="md" variant="panel">
          <div className="mb-2 text-label-md font-bold text-muted-foreground">
            구조 가이드
          </div>
          <p className="font-medium text-body-md leading-relaxed text-foreground whitespace-pre-line">
            {structure}
          </p>
        </Surface>
      )}
      <Textarea
        className={cn("text-body-md p-6 outline-none", minHeight)}
        disabled={checked !== false}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        value={text}
      />
      <div className="flex items-center justify-between text-label-md font-bold text-muted-foreground">
        <span>
          {text.length}자 · 최소 {min}
          {goal === undefined ? "" : ` · 목표 ${goal}`}
          {` · 최대 ${max}`}
        </span>
        <span
          className={cn(
            text.length >= min
              ? "text-success-foreground"
              : "text-danger-foreground"
          )}
        >
          {text.length >= min ? "✓" : "✗"}
        </span>
      </div>
      {draft ? (
        <Button
          className="w-fit self-start"
          onClick={() => {
            onDraftSave?.(text)
            setDraftSaved(true)
            setTimeout(() => setDraftSaved(false), 2000)
          }}
          type="button"
          variant="link"
        >
          {draftSaved ? "저장됨" : "드래프트 저장"}
        </Button>
      ) : null}
      {checked !== false && sample !== undefined ? (
        <Surface size="md" variant="panel">
          <div className="mb-2 font-bold text-muted-foreground">참조 답안</div>
          <p className="font-medium text-body-md text-foreground whitespace-pre-line">
            {sample}
          </p>
        </Surface>
      ) : null}
    </div>
  )
}
