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
      <p className="text-base leading-6 font-semibold text-foreground">
        {content.instruction}
      </p>
      {originalText && (
        <details className="rounded-xl bg-surface-secondary">
          <summary className="cursor-pointer px-4 py-3 text-sm leading-6 font-medium text-muted">
            원본 글 보기
          </summary>
          <div className="border-t border-separator/80 px-4 py-3">
            <p className="text-sm leading-6 whitespace-pre-line text-muted/80">
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
        <span className="text-xs leading-5 font-medium text-muted/80">
          {displayText.length}자
        </span>
      </div>
    </div>
  )
}
