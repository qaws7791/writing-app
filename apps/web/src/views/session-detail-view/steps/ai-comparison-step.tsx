import { Button } from "@workspace/ui/components/ui/button"
import { Spinner } from "@workspace/ui/components/ui/spinner"

import type {
  AIComparisonContent,
  CrossReferenceStepProps,
  SessionAiStepState,
} from "@/views/session-detail-view/types"

type Props = CrossReferenceStepProps<AIComparisonContent>

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
    aiState?.kind === "comparison" && aiState.status === "succeeded"
      ? aiState.resultJson
      : null

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg leading-7 font-semibold text-foreground">
        비교 분석
      </h2>

      <div className="grid gap-3">
        <div className="rounded-xl bg-muted p-4">
          <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80">
            초안
          </p>
          <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
            {originalText}
          </p>
        </div>
        <div className="rounded-xl bg-muted p-4">
          <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-accent">
            수정본
          </p>
          <p className="text-sm leading-6 whitespace-pre-line text-foreground">
            {rewrittenText}
          </p>
        </div>
      </div>

      {(aiState === undefined || aiState.status === "pending") && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Spinner />
          <p className="text-sm leading-6">
            {content.loadingMessage || "AI가 수정 전후 글을 비교하고 있어요..."}
          </p>
        </div>
      )}

      {aiState?.status === "failed" && (
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-sm leading-6 text-muted-foreground">
            {aiState.errorMessage ??
              "비교 분석을 생성하는 중 오류가 발생했어요."}
          </p>
          <Button
            onClick={() => onRetryAi?.(step.order)}
            disabled={isRetryingAi}
            variant="default"
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
              className="rounded-2xl border border-accent/30 bg-accent/50 p-4"
            >
              {index === 0 && (
                <p className="mb-2 text-xs leading-5 font-semibold tracking-wide text-accent">
                  개선 포인트
                </p>
              )}
              <p className="text-sm leading-6 text-foreground">{improvement}</p>
            </div>
          ))}
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80">
              종합 코멘트
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {comparison.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
