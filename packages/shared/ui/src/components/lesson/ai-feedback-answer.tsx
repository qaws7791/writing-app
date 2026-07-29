"use client"

import { useState } from "react"

import { platformDayBoundary } from "@workspace/kernel/day-boundary"

import { Button } from "#ui/components/ui/button"

export type AiFeedbackViewModel = {
  readonly improvements: readonly string[]
  readonly nextAction: string
  readonly remainingAttempts: number
  readonly strengths: readonly string[]
  readonly summary: string
}

export type AiFeedbackRequestOutcome =
  | {
      readonly feedback: AiFeedbackViewModel
      readonly status: "ok"
    }
  | {
      readonly kind: "fatal" | "limit" | "quota" | "retryable"
      readonly message: string
      readonly retryAfterSeconds?: number
      readonly status: "error"
    }

export type AiFeedbackContinueOutcome =
  | { readonly status: "ok" }
  | { readonly message: string; readonly status: "error" }

export function AiFeedbackAnswer({
  allowRetry,
  draftText = "",
  focus,
  onContinueWithoutFeedback,
  onRequest,
}: {
  readonly allowRetry: boolean
  readonly draftText?: string
  readonly focus: string
  readonly onContinueWithoutFeedback?: () => Promise<AiFeedbackContinueOutcome>
  readonly onRequest?: () => Promise<AiFeedbackRequestOutcome>
}) {
  const [failure, setFailure] = useState<AiFeedbackFailureState | null>(null)
  const [feedback, setFeedback] = useState<AiFeedbackViewModel | null>(null)
  const [isContinueSaved, setIsContinueSaved] = useState(false)
  const [continueError, setContinueError] = useState<null | string>(null)
  const [isContinuing, setIsContinuing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest() {
    if (onRequest === undefined) {
      setFailure({
        kind: "fatal",
        message: "AI 코칭을 사용할 수 없습니다.",
        retryAt: null,
        status: "error",
      })
      return
    }

    setFailure(null)
    setIsLoading(true)

    const result = await onRequest()

    setIsLoading(false)

    if (result.status === "error") {
      setFailure({
        ...result,
        retryAt: createRetryAt(result.retryAfterSeconds),
      })
      return
    }

    setFeedback(result.feedback)
  }

  async function handleContinueWithoutFeedback() {
    if (onContinueWithoutFeedback === undefined) return
    setContinueError(null)
    setIsContinuing(true)
    const result = await onContinueWithoutFeedback()
    setIsContinuing(false)

    if (result.status === "error") {
      setContinueError(result.message)
      return
    }

    setIsContinueSaved(true)
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
          className="inline-block bg-bg-surface text-fg-default font-bold px-4 py-2 rounded-full mb-4"
          style={{ fontSize: "0.875rem" }}
        >
          코칭 초점: {focus}
        </div>
      ) : null}

      <div className="bg-bg-surface rounded-4xl p-6 mb-6">
        <div className="font-bold text-fg-muted mb-2">작성 내용</div>
        <p className="font-medium whitespace-pre-line">{displayText}</p>
      </div>

      {isLoading ? (
        <div
          aria-live="polite"
          className="bg-bg-surface rounded-4xl p-6 mb-6 text-center"
          role="status"
        >
          <div className="mb-2" style={{ fontSize: "1.75rem" }}>
            🤖
          </div>
          <p className="font-bold">AI가 코칭 중입니다...</p>
        </div>
      ) : null}

      {failure === null ? null : <AiFeedbackFailureView failure={failure} />}

      {feedback === null ? null : <AiFeedbackResultView feedback={feedback} />}

      {continueError === null ? null : (
        <p
          className="mb-4 rounded-4xl bg-danger p-4 font-medium text-danger-foreground"
          role="alert"
        >
          {continueError}
        </p>
      )}

      <div className="flex flex-col gap-3 mt-2">
        {isContinueSaved ? (
          <p
            className="rounded-4xl bg-success p-4 text-center font-bold text-success-foreground"
            role="status"
          >
            피드백 없이 학습 진행을 저장했습니다. 아래 다음 버튼을 눌러
            계속하세요.
          </p>
        ) : failure !== null ? (
          <>
            {failure.kind === "retryable" ? (
              <Button
                className="w-full font-bold"
                disabled={isLoading || isContinuing}
                onClick={handleRequest}
                size="lg"
                variant="secondary"
              >
                AI 코칭 다시 시도
              </Button>
            ) : null}
            {onContinueWithoutFeedback === undefined ? null : (
              <Button
                className="w-full font-bold"
                disabled={isLoading || isContinuing}
                onClick={handleContinueWithoutFeedback}
                size="lg"
                variant="ink"
              >
                {isContinuing ? "학습 진행 저장 중..." : "피드백 없이 계속하기"}
              </Button>
            )}
          </>
        ) : feedback === null ? (
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
          <div className="bg-bg-surface text-fg-muted p-4 text-center rounded-4xl font-bold">
            남은 AI 코칭 시도 횟수가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

type AiFeedbackFailureState = Extract<
  AiFeedbackRequestOutcome,
  { readonly status: "error" }
> & {
  readonly retryAt: string | null
}

function AiFeedbackFailureView({
  failure,
}: {
  readonly failure: AiFeedbackFailureState
}) {
  return (
    <div
      className="mb-6 rounded-4xl bg-danger p-4 text-danger-foreground"
      role="alert"
    >
      <p className="font-bold">{getAiFeedbackFailureTitle(failure)}</p>
      <p className="mt-2 font-medium">
        {getAiFeedbackFailureGuidance(failure)}
      </p>
      {failure.kind === "quota" && failure.retryAt !== null ? (
        <p className="mt-2 font-medium">
          <time dateTime={failure.retryAt}>
            {formatRetryAt(failure.retryAt)}
          </time>{" "}
          이후 다시 요청할 수 있습니다.
        </p>
      ) : null}
    </div>
  )
}

function getAiFeedbackFailureTitle(failure: AiFeedbackFailureState): string {
  switch (failure.kind) {
    case "retryable":
      return "AI 코칭을 잠시 불러오지 못했습니다."
    case "quota":
      return "오늘의 AI 코칭 요청 한도를 모두 사용했습니다."
    case "limit":
      return "이 단계의 AI 코칭 3회를 모두 사용했습니다."
    case "fatal":
      return "AI 코칭 요청을 완료하지 못했습니다."
  }
}

function getAiFeedbackFailureGuidance(failure: AiFeedbackFailureState): string {
  switch (failure.kind) {
    case "retryable":
      return `${failure.message} 다시 시도하거나 피드백 없이 계속할 수 있습니다.`
    case "quota":
      return "한도가 갱신된 뒤 다시 요청하거나 피드백 없이 계속할 수 있습니다."
    case "limit":
      return "이 단계에서는 더 요청할 수 없지만 학습은 계속할 수 있습니다."
    case "fatal":
      return `${failure.message} 피드백 없이 학습을 계속할 수 있습니다.`
  }
}

function createRetryAt(retryAfterSeconds: number | undefined): string | null {
  if (retryAfterSeconds === undefined) return null
  const retryAt = new Date(Date.now() + retryAfterSeconds * 1_000)
  return Number.isNaN(retryAt.getTime()) ? null : retryAt.toISOString()
}

function formatRetryAt(retryAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: platformDayBoundary.timeZone,
  }).format(new Date(retryAt))
}

function AiFeedbackResultView({
  feedback,
}: {
  readonly feedback: AiFeedbackViewModel
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-accent-soft rounded-4xl p-6 mb-2">
        <div className="font-bold text-fg-muted mb-2">🤖 총평</div>
        <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
          {feedback.summary}
        </p>
      </div>

      {feedback.strengths.length > 0 ? (
        <div className="rounded-4xl bg-success p-6 text-success-foreground mb-2">
          <FeedbackList items={feedback.strengths} title="✅ 잘된 점" />
        </div>
      ) : null}

      {feedback.improvements.length > 0 ? (
        <div className="bg-danger rounded-4xl p-6 text-danger-foreground mb-2">
          <FeedbackList items={feedback.improvements} title="🔧 다듬을 점" />
        </div>
      ) : null}

      {feedback.nextAction ? (
        <div className="bg-action-primary-bg text-action-primary-fg rounded-4xl p-6 mb-2">
          <div className="font-bold opacity-70 mb-2">🎯 다음 시도</div>
          <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
            {feedback.nextAction}
          </p>
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
      <div className="font-bold mb-3">{title}</div>
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
