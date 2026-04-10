import type {
  RewritingContent,
  InputStepState,
  Step,
  StepState,
} from "@/views/session-detail-view/types"

interface RewritingStepProps {
  content: RewritingContent
  state: InputStepState | undefined
  onStateChange: (state: InputStepState) => void
  allStepStates: Record<string, StepState>
  steps: Step[]
}

export function RewritingStep({
  content,
  state,
  onStateChange,
  allStepStates,
}: RewritingStepProps) {
  const text = state?.text ?? ""

  const originalState = allStepStates[content.originalWritingStepId] as
    | { text?: string }
    | undefined
  const originalText = originalState?.text ?? ""

  const displayText = text || originalText

  return (
    <div className="flex flex-col gap-5">
      <p className="text-title-small-em text-on-surface">
        {content.instruction}
      </p>
      {originalText && (
        <details className="rounded-xl bg-surface-container">
          <summary className="cursor-pointer px-4 py-3 text-body-medium-em text-on-surface-low">
            원본 글 보기
          </summary>
          <div className="border-t border-outline/10 px-4 py-3">
            <p className="text-body-medium whitespace-pre-line text-on-surface-lowest">
              {originalText}
            </p>
          </div>
        </details>
      )}
      <textarea
        value={displayText}
        onChange={(e) =>
          onStateChange({
            text: e.target.value,
            hasInput:
              e.target.value.length > 0 && e.target.value !== originalText,
          })
        }
        rows={10}
        className="w-full resize-none rounded-xl border border-outline/20 bg-surface-container-low px-4 py-3 text-body-medium text-on-surface placeholder:text-on-surface-lowest focus:border-primary focus:outline-none"
      />
      <div className="flex justify-end">
        <span className="text-label-medium text-on-surface-lowest">
          {displayText.length}자
        </span>
      </div>
    </div>
  )
}
