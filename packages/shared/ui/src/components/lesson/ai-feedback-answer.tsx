"use client"

import { useState } from "react"

import { platformDayBoundary } from "@workspace/kernel/day-boundary"

import { Button } from "#ui/components/ui/button"
import {
  Coaching,
  CoachingActions,
  CoachingFocus,
  CoachingItem,
  CoachingList,
  CoachingResult,
  CoachingSection,
  CoachingSectionTitle,
  CoachingSource,
  CoachingSourceBody,
  CoachingSourceLabel,
  CoachingStatus,
  CoachingSummary,
  type CoachingPhase,
} from "#ui/components/ui/coaching"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
  InsightTitle,
} from "#ui/components/ui/insight"
import { StepBody, StepHeader, StepTitle } from "#ui/components/ui/step"

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
      readonly retryAfterSeconds?: number
      readonly status: "error"
    }

export type AiFeedbackContinueOutcome =
  | { readonly status: "ok" }
  | { readonly status: "error" }

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
  const [hasContinued, setHasContinued] = useState(false)
  const [continueError, setContinueError] = useState(false)
  const [isContinuing, setIsContinuing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest() {
    if (onRequest === undefined) {
      setFailure({
        kind: "fatal",
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
    setContinueError(false)
    setIsContinuing(true)
    const result = await onContinueWithoutFeedback()
    setIsContinuing(false)

    if (result.status === "error") {
      setContinueError(true)
      return
    }

    setHasContinued(true)
  }

  const canRetry =
    feedback !== null && allowRetry && feedback.remainingAttempts > 0
  const displayText =
    draftText.trim() === "" ? "(작성된 내용이 없습니다)" : draftText
  const status: CoachingPhase = isLoading
    ? "loading"
    : failure === null
      ? feedback === null
        ? "idle"
        : "ready"
      : failure.kind === "limit" || failure.kind === "quota"
        ? "limited"
        : "error"

  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>AI 코칭</h2>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Coaching status={status}>
          {focus ? <CoachingFocus>코칭 초점: {focus}</CoachingFocus> : null}

          <CoachingSource>
            <CoachingSourceLabel>작성 내용</CoachingSourceLabel>
            <CoachingSourceBody>{displayText}</CoachingSourceBody>
          </CoachingSource>

          {isLoading ? (
            <CoachingStatus>AI가 코칭 중입니다...</CoachingStatus>
          ) : null}

          {failure === null ? null : (
            <AiFeedbackFailureView failure={failure} />
          )}

          {feedback === null ? null : (
            <AiFeedbackResultView feedback={feedback} />
          )}

          {!continueError ? null : (
            <Insight role="alert" tone="incorrect">
              <InsightEyebrow>계속하지 못했어요</InsightEyebrow>
              <InsightDescription>
                작성한 내용은 그대로 있어요. 잠시 후 다시 시도해 주세요.
              </InsightDescription>
            </Insight>
          )}

          {hasContinued ? (
            <Insight role="status" tone="correct">
              <InsightTitle>다음 학습으로 이동합니다.</InsightTitle>
            </Insight>
          ) : (
            <CoachingActions>
              {failure !== null ? (
                <>
                  {failure.kind === "retryable" ? (
                    <Button
                      className="w-full sm:w-auto"
                      disabled={isLoading || isContinuing}
                      onClick={handleRequest}
                      size="lg"
                      variant="secondary"
                    >
                      AI 코칭 다시 받기
                    </Button>
                  ) : null}
                  {onContinueWithoutFeedback === undefined ? null : (
                    <Button
                      className="w-full sm:w-auto"
                      disabled={isLoading || isContinuing}
                      onClick={handleContinueWithoutFeedback}
                      size="lg"
                    >
                      {isContinuing ? "계속하는 중…" : "피드백 없이 계속하기"}
                    </Button>
                  )}
                </>
              ) : feedback === null ? (
                <Button
                  className="w-full sm:ml-auto sm:w-auto"
                  disabled={isLoading}
                  onClick={handleRequest}
                  size="lg"
                >
                  AI 코칭 받기
                </Button>
              ) : canRetry ? (
                <Button
                  className="w-full sm:ml-auto sm:w-auto"
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
                <Insight className="w-full" tone="neutral">
                  <InsightDescription>
                    남은 AI 코칭 시도 횟수가 없습니다.
                  </InsightDescription>
                </Insight>
              )}
            </CoachingActions>
          )}
        </Coaching>
      </StepBody>
    </>
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
    <Insight role="alert" tone="incorrect">
      <InsightTitle>{getAiFeedbackFailureTitle(failure)}</InsightTitle>
      <InsightDescription>
        <p>{getAiFeedbackFailureGuidance(failure)}</p>
        {failure.kind === "quota" && failure.retryAt !== null ? (
          <p>
            <time dateTime={failure.retryAt}>
              {formatRetryAt(failure.retryAt)}
            </time>{" "}
            이후 다시 받을 수 있습니다.
          </p>
        ) : null}
      </InsightDescription>
    </Insight>
  )
}

function getAiFeedbackFailureTitle(failure: AiFeedbackFailureState): string {
  switch (failure.kind) {
    case "retryable":
      return "AI 코칭을 잠시 불러오지 못했습니다."
    case "quota":
      return "오늘 받을 수 있는 AI 코칭을 모두 사용했어요."
    case "limit":
      return "이 단계에서 받을 수 있는 AI 코칭 3회를 모두 사용했어요."
    case "fatal":
      return "AI 코칭을 받지 못했어요."
  }
}

function getAiFeedbackFailureGuidance(failure: AiFeedbackFailureState): string {
  switch (failure.kind) {
    case "retryable":
      return "잠시 후 다시 받거나 피드백 없이 계속할 수 있어요."
    case "quota":
      return "표시된 시간 이후 다시 받거나 피드백 없이 계속할 수 있어요."
    case "limit":
      return "이 단계에서는 더 받을 수 없지만 학습은 계속할 수 있어요."
    case "fatal":
      return "피드백 없이 학습을 계속할 수 있어요."
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
    <CoachingResult>
      {feedback.summary ? (
        <CoachingSummary>{feedback.summary}</CoachingSummary>
      ) : null}

      {feedback.strengths.length > 0 ? (
        <FeedbackList items={feedback.strengths} title="잘된 점" />
      ) : null}

      {feedback.improvements.length > 0 ? (
        <FeedbackList items={feedback.improvements} title="다듬을 점" />
      ) : null}

      {feedback.nextAction ? (
        <CoachingSection>
          <CoachingSectionTitle>다음 시도</CoachingSectionTitle>
          <CoachingSummary>{feedback.nextAction}</CoachingSummary>
        </CoachingSection>
      ) : null}
    </CoachingResult>
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
    <CoachingSection>
      <CoachingSectionTitle>{title}</CoachingSectionTitle>
      <CoachingList>
        {items.map((item) => (
          <CoachingItem key={item}>{item}</CoachingItem>
        ))}
      </CoachingList>
    </CoachingSection>
  )
}
