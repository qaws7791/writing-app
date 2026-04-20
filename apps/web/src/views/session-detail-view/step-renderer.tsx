import { renderStep } from "@/views/session-detail-view/step-registry"
import type { Step, StepState } from "@/views/session-detail-view/types"

interface StepRendererProps {
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  sessionId: string
  step: Step
  stepState: StepState
  onStateChange: (state: StepState) => void
  allStepStates: Record<string, StepState>
  steps: Step[]
}

export function StepRenderer({
  isRetryingAi,
  onRetryAi,
  sessionId,
  step,
  stepState,
  onStateChange,
  allStepStates,
  steps,
}: StepRendererProps) {
  return renderStep({
    allStepStates,
    isRetryingAi,
    onRetryAi,
    onStateChange,
    sessionId,
    step,
    stepState,
    steps,
  })
}
