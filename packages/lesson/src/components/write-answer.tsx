import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"

import type { StepProps } from "./step-types"
import type { WriteStep } from "../lesson-types"
import { emitAnswer } from "../utils/emit-answer"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { cn } from "@workspace/ui/lib/utils"

export function WriteAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: StepProps<WriteStep>) {
  const [text, setText] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`writing-app-draft-${step.id}`) ?? ""
    }
    return ""
  })
  const [draftSaved, setDraftSaved] = useState(false)
  const min = step.min || 20
  const max = step.max ?? 2000
  const goal = step.goal
  const title = step.title ?? step.prompt ?? ""
  const guide = step.guide || step.context
  const badge =
    step.badge ??
    (step.mode === "counter"
      ? "반박 쓰기"
      : step.mode === "self-rebut"
        ? "자기 반박"
        : null)
  const claimLabel =
    step.claimLabel ?? (step.mode === "self-rebut" ? "내 주장" : "대상 주장")
  const placeholder =
    step.placeholder ??
    (step.mode === "self-rebut"
      ? "내 주장의 약점을 스스로 짚어보세요..."
      : "여기에 작성하세요...")
  const minHeight = goal
    ? "min-h-[280px]"
    : step.claim
      ? "min-h-[200px]"
      : "min-h-[150px]"

  useEffect(() => {
    if (text) {
      emitAnswer(
        onAnswerChange,
        step.id,
        {
          text,
          type: "WRITE",
        },
        onAnswerPayloadChange
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(nextText: string) {
    const slicedText = nextText.slice(0, max)

    setText(slicedText)
    if (typeof window !== "undefined") {
      localStorage.setItem(`writing-app-draft-${step.id}`, slicedText)
    }

    emitAnswer(
      onAnswerChange,
      step.id,
      {
        text: slicedText,
        type: "WRITE",
      },
      onAnswerPayloadChange
    )
  }

  return (
    <div className="an-fi flex flex-col gap-4">
      <h2 className="text-heading-sm font-bold text-foreground">{title}</h2>
      {badge === null ? null : (
        <Badge className="w-fit" tone="neutral">
          {badge}
        </Badge>
      )}
      {step.claim === undefined ? null : (
        <Surface size="md" variant="panel">
          <div className="mb-2 text-label-md font-bold text-muted-foreground">
            {claimLabel}
          </div>
          <p className="text-body-lg font-medium text-foreground">
            {step.claim}
          </p>
        </Surface>
      )}
      {guide ? (
        <div className="prose prose-sm max-w-none mb-4 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
          <ReactMarkdown>{guide}</ReactMarkdown>
        </div>
      ) : null}
      {step.reference === undefined ? null : (
        <Surface size="md" variant="panel">
          <div className="mb-2 text-label-md font-bold text-muted-foreground">
            참고 원문
          </div>
          <p className="text-body-md leading-relaxed text-foreground whitespace-pre-line">
            {step.reference}
          </p>
        </Surface>
      )}
      {step.structure === undefined ? null : (
        <Surface size="md" variant="panel">
          <div className="mb-2 text-label-md font-bold text-muted-foreground">
            구조 가이드
          </div>
          <p className="font-medium text-body-md leading-relaxed text-foreground whitespace-pre-line">
            {step.structure}
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
      {step.draft ? (
        <Button
          className="w-fit self-start"
          onClick={() => {
            setDraftSaved(true)
            setTimeout(() => setDraftSaved(false), 2000)
          }}
          type="button"
          variant="link"
        >
          {draftSaved ? "저장됨" : "드래프트 저장"}
        </Button>
      ) : null}
      {checked !== false && step.sample !== undefined ? (
        <Surface size="md" variant="panel">
          <div className="mb-2 font-bold text-muted-foreground">참조 답안</div>
          <p className="font-medium text-body-md text-foreground whitespace-pre-line">
            {step.sample}
          </p>
        </Surface>
      ) : null}
    </div>
  )
}
