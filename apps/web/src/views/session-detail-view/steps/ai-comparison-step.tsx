import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

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
      <h2 className="text-title-medium-em text-on-surface">비교 분석</h2>

      <div className="grid gap-3">
        <div className="bg-surface-container rounded-xl p-4">
          <p className="text-label-medium-em text-on-surface-lowest mb-2">
            초안
          </p>
          <p className="text-body-medium text-on-surface-low whitespace-pre-line">
            {originalText}
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-4">
          <p className="text-label-medium-em text-primary mb-2">수정본</p>
          <p className="text-body-medium text-on-surface whitespace-pre-line">
            {rewrittenText}
          </p>
        </div>
      </div>

      {(aiState === undefined || aiState.status === "pending") && (
        <div className="text-on-surface-low flex flex-col items-center justify-center gap-3 py-12">
          <Spinner size="sm" />
          <p className="text-body-medium">
            {content.loadingMessage || "AI가 수정 전후 글을 비교하고 있어요..."}
          </p>
        </div>
      )}

      {aiState?.status === "failed" && (
        <div className="bg-surface-container rounded-xl p-4 text-center">
          <p className="text-body-medium text-on-surface-low">
            {aiState.errorMessage ??
              "비교 분석을 생성하는 중 오류가 발생했어요."}
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

      {comparison && (
        <div className="flex flex-col gap-3">
          {comparison.improvements.map((improvement, index) => (
            <div
              key={`${improvement}-${index}`}
              className="border-primary/20 bg-primary/5 rounded-2xl border p-4"
            >
              {index === 0 && (
                <p className="text-label-medium-em text-primary mb-2">
                  개선 포인트
                </p>
              )}
              <p className="text-body-medium text-on-surface">{improvement}</p>
            </div>
          ))}
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-label-medium-em text-on-surface-lowest">
              종합 코멘트
            </p>
            <p className="text-body-medium text-on-surface-low mt-1">
              {comparison.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
