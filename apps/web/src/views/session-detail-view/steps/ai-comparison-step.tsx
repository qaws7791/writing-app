import type {
  AIComparisonContent,
  CrossReferenceStepProps,
} from "@/views/session-detail-view/types"

type Props = CrossReferenceStepProps<AIComparisonContent>

export function AIComparisonStep({ content, allStepStates }: Props) {
  const originalState = allStepStates[content.originalStepId] as
    | { text?: string }
    | undefined
  const rewritingState = allStepStates[content.rewritingStepId] as
    | { text?: string }
    | undefined

  const originalText = originalState?.text ?? "(초안 없음)"
  const rewrittenText = rewritingState?.text ?? "(수정본 없음)"

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

      {/* 프로토타입 목업 비교 분석 */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-xs font-semibold text-primary">개선 포인트</p>
          <p className="text-sm leading-relaxed text-on-surface">
            문장이 더 간결해졌고, 구체적인 표현이 추가되어 전달력이
            높아졌습니다.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container p-4">
          <p className="text-xs font-semibold text-on-surface-lowest">
            종합 코멘트
          </p>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-low">
            피드백을 잘 반영하여 글의 완성도가 높아졌습니다. 특히 구조가
            명확해진 점이 인상적입니다.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-on-surface-lowest">
        * 프로토타입 목업 분석입니다
      </p>
    </div>
  )
}
