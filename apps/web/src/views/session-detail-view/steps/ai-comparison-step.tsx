import type {
  AIComparisonContent,
  CrossReferenceStepProps,
  RevisionComparisonResult,
  SessionAiStepState,
} from "@/views/session-detail-view/types"

type Props = CrossReferenceStepProps<AIComparisonContent>

function isRevisionComparisonResult(
  value: SessionAiStepState["resultJson"]
): value is RevisionComparisonResult {
  return value !== null && "improvements" in value && "summary" in value
}

export function AIComparisonStep({
  content,
  allStepStates,
  isRetryingAi = false,
  onRetryAi,
  step,
}: Props) {
  const originalState = allStepStates[content.originalStepId] as
    | { text?: string }
    | undefined
  const rewritingState = allStepStates[content.rewritingStepId] as
    | { text?: string }
    | undefined
  const aiState = allStepStates[step.id] as SessionAiStepState | undefined

  const originalText = originalState?.text ?? "(초안 없음)"
  const rewrittenText = rewritingState?.text ?? "(수정본 없음)"
  const comparison =
    aiState?.status === "succeeded" &&
    isRevisionComparisonResult(aiState.resultJson)
      ? aiState.resultJson
      : null

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-on-surface">비교 분석</h2>

      <div className="grid gap-3">
        <div className="rounded-xl bg-surface-container p-4">
          <p className="mb-2 text-xs font-semibold text-on-surface-lowest">
            초안
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-on-surface-low">
            {originalText}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container p-4">
          <p className="mb-2 text-xs font-semibold text-primary">수정본</p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-on-surface">
            {rewrittenText}
          </p>
        </div>
      </div>

      {(aiState === undefined || aiState.status === "pending") && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-on-surface-low">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">
            {content.loadingMessage || "AI가 수정 전후 글을 비교하고 있어요..."}
          </p>
        </div>
      )}

      {aiState?.status === "failed" && (
        <div className="rounded-xl bg-surface-container p-4 text-center">
          <p className="text-sm text-on-surface-low">
            {aiState.errorMessage ??
              "비교 분석을 생성하는 중 오류가 발생했어요."}
          </p>
          <button
            onClick={() => onRetryAi?.(step.order)}
            disabled={isRetryingAi}
            className="mt-3 rounded-full bg-on-surface px-4 py-2 text-xs font-semibold text-surface"
          >
            {isRetryingAi ? "재시도 중..." : "다시 시도"}
          </button>
        </div>
      )}

      {comparison && (
        <div className="flex flex-col gap-3">
          {comparison.improvements.map((improvement, index) => (
            <div
              key={`${improvement}-${index}`}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
            >
              {index === 0 && (
                <p className="mb-2 text-xs font-semibold text-primary">
                  개선 포인트
                </p>
              )}
              <p className="text-sm leading-relaxed text-on-surface">
                {improvement}
              </p>
            </div>
          ))}
          <div className="rounded-xl bg-surface-container p-4">
            <p className="text-xs font-semibold text-on-surface-lowest">
              종합 코멘트
            </p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-low">
              {comparison.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
