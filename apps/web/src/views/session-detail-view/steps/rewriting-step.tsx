import { Textarea } from "@workspace/ui/components/ui/textarea"

import {
  getStepState,
  isInputStepState,
} from "@/views/session-detail-view/step-state"
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

  const originalState = getStepState(
    allStepStates,
    content.originalWritingStepId,
    isInputStepState
  )
  const originalText = originalState?.text ?? ""

  const displayText = text || originalText

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-6 font-semibold text-foreground">
        {content.instruction}
      </p>
      {originalText && (
        <details className="rounded-xl bg-muted">
          <summary className="cursor-pointer px-4 py-3 text-sm leading-6 font-medium text-muted-foreground">
            원본 글 보기
          </summary>
          <div className="border-t border-border/80 px-4 py-3">
            <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground/80">
              {originalText}
            </p>
          </div>
        </details>
      )}
      <Textarea
        value={displayText}
        onChange={(e) =>
          onStateChange({
            text: e.target.value,
            hasInput:
              e.target.value.length > 0 && e.target.value !== originalText,
          })
        }
        rows={10}
      />
      <div className="flex justify-end">
        <span className="text-xs leading-5 font-medium text-muted-foreground/80">
          {displayText.length}자
        </span>
      </div>
    </div>
  )
}
