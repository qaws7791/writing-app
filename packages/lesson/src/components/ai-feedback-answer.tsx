import { useState, useEffect } from "react"

import type { StepProps } from "./step-types"
import type { LessonAiFeedback } from "../lesson-logic"
import type { AiFeedbackStep } from "../lesson-types"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"

export function AiFeedbackAnswer({
  onAiFeedbackRequest,
  step,
}: StepProps<AiFeedbackStep>) {
  const [error, setError] = useState<null | string>(null)
  const [feedback, setFeedback] = useState<LessonAiFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [draftText, setDraftText] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`writing-app-draft-${step.target}`)
      if (saved) {
        setDraftText(saved)
      }
    }
  }, [step.target])

  async function handleRequest() {
    if (onAiFeedbackRequest === undefined) {
      setError("AI 코칭을 사용할 수 없습니다.")
      return
    }

    setError(null)
    setIsLoading(true)

    const result = await onAiFeedbackRequest({
      answer: draftText || step.target,
      stepId: step.id,
    })

    setIsLoading(false)

    if (result.status === "error") {
      setError(result.message)
      return
    }

    setFeedback(result.feedback)
  }

  const canRetry =
    feedback !== null && step.allowRetry && feedback.remainingAttempts > 0

  return (
    <div className="an-fi flex flex-col gap-5">
      {step.focus ? (
        <Badge className="w-fit" tone="neutral">
          코칭 초점: {step.focus}
        </Badge>
      ) : null}

      <Surface className="p-6" variant="panel">
        <div className="font-bold text-muted-foreground text-body-sm mb-2">
          작성 내용
        </div>
        <p className="font-medium text-body-md whitespace-pre-line text-foreground">
          {draftText || "(작성된 내용이 없거나 불러올 수 없습니다)"}
        </p>
      </Surface>

      {isLoading ? (
        <Surface className="p-6 text-center animate-pulse" variant="panel">
          <div className="mb-2 text-4xl">🤖</div>
          <p className="font-bold text-body-md text-foreground">
            AI가 코칭을 준비하고 있습니다...
          </p>
        </Surface>
      ) : null}

      {error === null ? null : (
        <Surface
          className="border-danger-fg/20 bg-danger text-danger-foreground p-4"
          variant="panel"
        >
          <p className="font-medium text-body-sm">{error}</p>
        </Surface>
      )}

      {feedback === null ? null : <AiFeedbackResultView feedback={feedback} />}

      <div className="flex flex-col gap-3 mt-2">
        {feedback === null ? (
          <Button
            disabled={isLoading}
            onClick={handleRequest}
            size="lg"
            className="w-full font-bold"
          >
            AI 코칭 받기
          </Button>
        ) : canRetry ? (
          <Button
            disabled={isLoading}
            onClick={handleRequest}
            variant="secondary"
            size="lg"
            className="w-full font-bold"
          >
            {isLoading
              ? "코칭 중..."
              : `AI 코칭 다시 받기 (${feedback.remainingAttempts}회 남음)`}
          </Button>
        ) : (
          <div className="border border-border bg-surface text-muted-foreground p-4 text-center rounded-panel font-bold text-body-sm">
            남은 AI 코칭 시도 횟수가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

function AiFeedbackResultView({
  feedback,
}: {
  readonly feedback: LessonAiFeedback
}) {
  return (
    <div className="flex flex-col gap-4">
      <Surface
        className="bg-accent-soft/20 border border-action-selected-fg/20 p-6"
        variant="panel"
      >
        <div className="font-bold text-accent text-body-sm mb-2">🤖 총평</div>
        <p className="font-medium text-body-md leading-relaxed text-foreground">
          {feedback.summary}
        </p>
      </Surface>

      {feedback.strengths && feedback.strengths.length > 0 ? (
        <Surface
          className="bg-success/15 border border-success-fg/10 text-success-foreground p-6"
          variant="panel"
        >
          <FeedbackList items={feedback.strengths} title="✅ 잘된 점" />
        </Surface>
      ) : null}

      {feedback.improvements && feedback.improvements.length > 0 ? (
        <Surface
          className="bg-danger/10 border border-danger-fg/10 text-danger-foreground p-6"
          variant="panel"
        >
          <FeedbackList items={feedback.improvements} title="🔧 다듬을 점" />
        </Surface>
      ) : null}

      {feedback.nextAction ? (
        <Surface className="bg-foreground text-background p-6" variant="panel">
          <div className="font-bold text-background/80 text-body-sm mb-2">
            🎯 다음 시도
          </div>
          <p className="font-medium text-body-md leading-relaxed">
            {feedback.nextAction}
          </p>
        </Surface>
      ) : null}

      {feedback.showScore ? (
        <div className="flex items-center justify-center gap-4 mt-4 py-2">
          <div className="w-24 h-24 bg-foreground rounded-full flex justify-center items-center text-background font-black text-2xl shadow-md">
            {feedback.score}
          </div>
          <div className="text-muted-foreground font-bold text-body-lg">
            / {feedback.scoreRange[1]}점
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FeedbackList({
  items,
  title,
}: {
  readonly items: readonly string[]
  readonly title: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-bold text-body-md">{title}</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-body-sm font-medium">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
