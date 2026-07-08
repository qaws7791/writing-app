"use client"

import { useState } from "react"

import { Button } from "../ui/button"

export type AiFeedbackViewModel = {
  readonly improvements: readonly string[]
  readonly nextAction: string
  readonly remainingAttempts: number
  readonly score: number
  readonly scoreRange: readonly [number, number]
  readonly showScore: boolean
  readonly strengths: readonly string[]
  readonly summary: string
}

export type AiFeedbackRequestOutcome =
  | {
      readonly feedback: AiFeedbackViewModel
      readonly status: "ok"
    }
  | {
      readonly message: string
      readonly status: "error"
    }

export function AiFeedbackAnswer({
  allowRetry,
  draftText = "",
  focus,
  onRequest,
}: {
  readonly allowRetry: boolean
  readonly draftText?: string
  readonly focus: string
  readonly onRequest?: () => Promise<AiFeedbackRequestOutcome>
}) {
  const [error, setError] = useState<null | string>(null)
  const [feedback, setFeedback] = useState<AiFeedbackViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest() {
    if (onRequest === undefined) {
      setError("AI 코칭을 사용할 수 없습니다.")
      return
    }

    setError(null)
    setIsLoading(true)

    const result = await onRequest()

    setIsLoading(false)

    if (result.status === "error") {
      setError(result.message)
      return
    }

    setFeedback(result.feedback)
  }

  const canRetry =
    feedback !== null && allowRetry && feedback.remainingAttempts > 0
  const displayText =
    draftText.trim() === "" ? "(작성된 내용이 없습니다)" : draftText

  return (
    <div className="an-fi">
      <h2 className="font-bold mb-6" style={{ fontSize: "1.75rem" }}>
        AI 코칭
      </h2>
      {focus ? (
        <div
          className="inline-block bg-charcoal/5 text-charcoal font-bold px-4 py-2 rounded-full mb-4"
          style={{ fontSize: "0.875rem" }}
        >
          코칭 초점: {focus}
        </div>
      ) : null}

      <div className="bg-surface rounded-4xl p-6 mb-6">
        <div className="font-bold text-muted-foreground mb-2">작성 내용</div>
        <p className="font-medium whitespace-pre-line">{displayText}</p>
      </div>

      {isLoading ? (
        <div className="bg-surface rounded-4xl p-6 mb-6 text-center">
          <div className="mb-2" style={{ fontSize: "1.75rem" }}>
            🤖
          </div>
          <p className="font-bold">AI가 코칭 중입니다...</p>
        </div>
      ) : null}

      {error === null ? null : (
        <div className="bg-coral-light rounded-4xl p-4 mb-6">
          <p className="font-medium text-charcoal">{error}</p>
        </div>
      )}

      {feedback === null ? null : <AiFeedbackResultView feedback={feedback} />}

      <div className="flex flex-col gap-3 mt-2">
        {feedback === null ? (
          <Button
            className="w-full font-bold"
            disabled={isLoading}
            onClick={handleRequest}
            size="lg"
            variant="ink"
          >
            AI 코칭 받기
          </Button>
        ) : canRetry ? (
          <Button
            className="w-full font-bold"
            disabled={isLoading}
            onClick={handleRequest}
            size="lg"
            variant="secondary"
          >
            {isLoading
              ? "코칭 중..."
              : `AI 코칭 다시 받기 (${feedback.remainingAttempts}회 남음)`}
          </Button>
        ) : (
          <div className="bg-surface text-muted-foreground p-4 text-center rounded-4xl font-bold">
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
  readonly feedback: AiFeedbackViewModel
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-accent-soft rounded-4xl p-6 mb-2">
        <div className="font-bold text-muted-foreground mb-2">🤖 총평</div>
        <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
          {feedback.summary}
        </p>
      </div>

      {feedback.strengths.length > 0 ? (
        <div
          className="rounded-4xl p-6 mb-2"
          style={{ background: "rgba(82,216,106,0.15)" }}
        >
          <FeedbackList items={feedback.strengths} title="✅ 잘된 점" />
        </div>
      ) : null}

      {feedback.improvements.length > 0 ? (
        <div className="bg-coral/10 rounded-4xl p-6 mb-2">
          <FeedbackList items={feedback.improvements} title="🔧 다듬을 점" />
        </div>
      ) : null}

      {feedback.nextAction ? (
        <div className="bg-charcoal text-cream rounded-4xl p-6 mb-2">
          <div className="font-bold text-cream/70 mb-2">🎯 다음 시도</div>
          <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
            {feedback.nextAction}
          </p>
        </div>
      ) : null}

      {feedback.showScore ? (
        <div className="flex items-center justify-center gap-4 mt-4 py-2">
          <div
            className="w-24 h-24 bg-charcoal rounded-full flex justify-center items-center text-cream font-black shadow-md"
            style={{ fontSize: "1.5rem" }}
          >
            {feedback.score}
          </div>
          <div
            className="text-muted-foreground font-bold"
            style={{ fontSize: "1.125rem" }}
          >
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
    <div>
      <div className="font-bold text-charcoal mb-3">{title}</div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="font-medium" key={item} style={{ fontSize: "1rem" }}>
            · {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
