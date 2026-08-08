"use client"

import { MarkdownContent } from "#ui/components/lesson/markdown-content"
import {
  Compose,
  ComposeBadge,
  ComposeClaim,
  ComposeContext,
  ComposeEditor,
  ComposeGuide,
  ComposeMeter,
  ComposeReference,
  ComposeSource,
} from "#ui/components/ui/compose"
import { StepBody, StepHeader, StepTitle } from "#ui/components/ui/step"
import type { LessonStepCheckedVisual } from "#ui/lib/lesson-step-checked-visual"

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
  function handleChange(nextText: string) {
    onChange?.(nextText.slice(0, max))
  }

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{title}</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Compose>
          {badge ? <ComposeBadge>{badge}</ComposeBadge> : null}
          {claim ? (
            <div className="flex flex-col gap-2">
              <ComposeContext>{claimLabel ?? "대상 주장"}</ComposeContext>
              <ComposeClaim>{claim}</ComposeClaim>
            </div>
          ) : null}
          {guide ? (
            <ComposeGuide>
              <MarkdownContent>{guide}</MarkdownContent>
            </ComposeGuide>
          ) : null}
          {reference ? (
            <ComposeSource>
              <ComposeContext className="mb-2">참고 원문</ComposeContext>
              {reference}
            </ComposeSource>
          ) : null}
          {structure ? (
            <ComposeGuide>
              <ComposeContext className="mb-2">구조 가이드</ComposeContext>
              <MarkdownContent className="whitespace-pre-line">
                {structure}
              </MarkdownContent>
            </ComposeGuide>
          ) : null}
          <ComposeEditor
            disabled={checked !== false}
            maxLength={max}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={placeholder}
            value={text}
          />
          <ComposeMeter
            {...(goal === undefined ? {} : { goal })}
            max={max}
            min={min}
            value={text.length}
          />
          {checked !== false && sample !== undefined ? (
            <ComposeReference>
              <ComposeContext className="mb-2">참조 답안</ComposeContext>
              <p className="whitespace-pre-line">{sample}</p>
            </ComposeReference>
          ) : null}
        </Compose>
      </StepBody>
    </>
  )
}
