"use client"

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
      <h2 className="text-title-medium-em text-on-surface">AI 피드백</h2>

      {userText && (
        <details className="rounded-xl bg-surface-container">
          <summary className="cursor-pointer px-4 py-3 text-body-medium-em text-on-surface-low">
            제출한 글 보기
          </summary>
          <div className="border-t border-outline/10 px-4 py-3">
            <p className="text-body-medium whitespace-pre-line text-on-surface-lowest">
              {userText}
            </p>
          </div>
        </details>
      )}

      {(aiState === undefined || aiState.status === "pending") && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-on-surface-low">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-body-medium">
            {content.loadingMessage || "AI가 글을 분석하고 있어요..."}
          </p>
        </div>
      )}

      {aiState?.status === "failed" && (
        <div className="rounded-xl bg-surface-container p-4 text-center">
          <p className="text-body-medium text-on-surface-low">
            {aiState.errorMessage ?? "피드백을 생성하는 중 오류가 발생했어요."}
          </p>
          <button
            onClick={() => onRetryAi?.(step.order)}
            disabled={isRetryingAi}
            className="mt-3 rounded-full bg-on-surface px-4 py-2 text-label-medium-em text-surface"
          >
            {isRetryingAi ? "재시도 중..." : "다시 시도"}
          </button>
        </div>
      )}

      {feedback && (
        <div className="flex flex-col gap-3">
          {feedback.strengths.map((strength, i) => (
            <div
              key={i}
              className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10"
            >
              {i === 0 && (
                <p className="mb-2 text-label-medium-em text-green-700 dark:text-green-400">
                  강점
                </p>
              )}
              <p className="text-body-medium text-green-900 dark:text-green-200">
                {strength}
              </p>
            </div>
          ))}
          {feedback.improvements.map((improvement, i) => (
            <div
              key={i}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
            >
              {i === 0 && (
                <p className="mb-2 text-label-medium-em text-amber-700 dark:text-amber-400">
                  개선점
                </p>
              )}
              <p className="text-body-medium text-amber-900 dark:text-amber-200">
                {improvement}
              </p>
            </div>
          ))}
          {feedback.question && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="mb-2 text-label-medium-em text-blue-700 dark:text-blue-400">
                생각해볼 질문
              </p>
              <p className="text-body-medium text-blue-900 dark:text-blue-200">
                {feedback.question}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
