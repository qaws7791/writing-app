import { TextField } from "@workspace/ui/components/text-field"
import { TextArea } from "@workspace/ui/components/textarea"

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
        <details className="bg-surface-container rounded-xl">
          <summary className="text-body-medium-em text-on-surface-low cursor-pointer px-4 py-3">
            원본 글 보기
          </summary>
          <div className="border-outline/10 border-t px-4 py-3">
            <p className="text-body-medium text-on-surface-lowest whitespace-pre-line">
              {originalText}
            </p>
          </div>
        </details>
      )}
      <TextField
        value={displayText}
        onChange={(value) =>
          onStateChange({
            text: value,
            hasInput: value.length > 0 && value !== originalText,
          })
        }
      >
        <TextArea rows={10} />
      </TextField>
      <div className="flex justify-end">
        <span className="text-label-medium text-on-surface-lowest">
          {displayText.length}자
        </span>
      </div>
    </div>
  )
}
