"use client"

import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import type {
  AIFeedbackContent,
  CrossReferenceStepProps,
  SessionAiStepState,
  WritingFeedbackResult,
} from "@/views/session-detail-view/types"

type Props = CrossReferenceStepProps<AIFeedbackContent>

function isWritingFeedbackResult(
  value: SessionAiStepState["resultJson"]
): value is WritingFeedbackResult {
  return (
    value !== null &&
    "strengths" in value &&
    "improvements" in value &&
    "question" in value
  )
}

export function AIFeedbackStep({
  content,
  allStepStates,
  isRetryingAi = false,
  onRetryAi,
  step,
}: Props) {
  const targetState = allStepStates[content.targetStepId] as
    | { text?: string }
    | undefined
  const userText = targetState?.text ?? ""
  const aiState = allStepStates[step.id] as SessionAiStepState | undefined
  const feedback =
    aiState?.status === "succeeded" &&
    isWritingFeedbackResult(aiState.resultJson)
      ? aiState.resultJson
      : null

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg leading-7 font-semibold text-foreground">
        AI 피드백
      </h2>

      {userText && (
        <details className="rounded-xl bg-surface-secondary">
          <summary className="cursor-pointer px-4 py-3 text-sm leading-6 font-medium text-muted">
            제출한 글 보기
          </summary>
          <div className="border-t border-separator/80 px-4 py-3">
            <p className="text-sm leading-6 whitespace-pre-line text-muted/80">
              {userText}
            </p>
          </div>
        </details>
      )}

      {(aiState === undefined || aiState.status === "pending") && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted">
          <Spinner size="sm" />
          <p className="text-sm leading-6">
            {content.loadingMessage || "AI가 글을 분석하고 있어요..."}
          </p>
        </div>
      )}

      {aiState?.status === "failed" && (
        <div className="rounded-xl bg-surface-secondary p-4 text-center">
          <p className="text-sm leading-6 text-muted">
            {aiState.errorMessage ?? "피드백을 생성하는 중 오류가 발생했어요."}
          </p>
          <Button
            onClick={() => onRetryAi?.(step.order)}
            isDisabled={isRetryingAi}
            variant="primary"
            size="sm"
            className="mt-3"
          >
            {isRetryingAi ? "재시도 중..." : "다시 시도"}
          </Button>
        </div>
      )}

      {feedback && (
        <div className="flex flex-col gap-3">
          {feedback.strengths.map((strength, i) => (
            <div
              key={i}
              className="rounded-2xl border border-success/30 bg-success/10 p-4"
            >
              {i === 0 && (
                <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-success-foreground">
                  강점
                </p>
              )}
              <p className="text-sm leading-6 text-success-foreground">
                {strength}
              </p>
            </div>
          ))}
          {feedback.improvements.map((improvement, i) => (
            <div
              key={i}
              className="rounded-2xl border border-warning/30 bg-warning/10 p-4"
            >
              {i === 0 && (
                <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-warning-foreground">
                  개선점
                </p>
              )}
              <p className="text-sm leading-6 text-warning-foreground">
                {improvement}
              </p>
            </div>
          ))}
          {feedback.question && (
            <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
              <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-accent-soft-foreground">
                생각해볼 질문
              </p>
              <p className="text-sm leading-6 text-accent-soft-foreground">
                {feedback.question}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
