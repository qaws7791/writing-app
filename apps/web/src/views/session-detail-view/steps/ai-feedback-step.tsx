import type {
  AIFeedbackContent,
  CrossReferenceStepProps,
} from "@/views/session-detail-view/types"

type Props = CrossReferenceStepProps<AIFeedbackContent>

export function AIFeedbackStep({ content, allStepStates }: Props) {
  const targetState = allStepStates[content.targetStepId] as
    | { text?: string }
    | undefined
  const userText = targetState?.text ?? ""

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-on-surface">AI 피드백</h2>

      {userText && (
        <details className="rounded-xl bg-surface-container">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-on-surface-low">
            제출한 글 보기
          </summary>
          <div className="border-t border-outline/10 px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-line text-on-surface-lowest">
              {userText}
            </p>
          </div>
        </details>
      )}

      {/* 프로토타입 목업 피드백 카드 */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
          <p className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">
            강점
          </p>
          <p className="text-sm leading-relaxed text-green-900 dark:text-green-200">
            주제에 대한 자신만의 관점이 잘 드러나 있습니다. 구체적인 경험을
            바탕으로 글을 전개한 점이 좋습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            개선점
          </p>
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
            문단 간의 전환이 조금 더 자연스러우면 좋겠습니다. 전환어를
            활용해보세요.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            생각해볼 질문
          </p>
          <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">
            이 경험이 지금의 당신에게 어떤 의미인지 한 문장으로 정리한다면?
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-on-surface-lowest">
        * 프로토타입 목업 피드백입니다
      </p>
    </div>
  )
}
