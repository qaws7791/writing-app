import type { SessionStepPayload } from "@workspace/core/modules/journeys"

import {
  deserializeStepResponses,
  fetchSessionDetail,
} from "@/features/sessions"
import type {
  Session,
  SessionAiStepState,
  Step,
  StepContent,
  StepState,
  StepType,
} from "@/views/session-detail-view/types"

export type SessionRuntime = Awaited<ReturnType<typeof fetchSessionDetail>>

export function mapSession(
  runtime: SessionRuntime | undefined
): Session | null {
  if (!runtime) {
    return null
  }

  const steps = runtime.steps.map(mapSessionStep)
  const [firstStep, ...remainingSteps] = steps

  if (!firstStep) {
    return null
  }

  return {
    id: String(runtime.id),
    order: runtime.order,
    title: runtime.title,
    description: runtime.description,
    steps: [firstStep, ...remainingSteps],
  }
}

export function mapStepStates(
  runtime: SessionRuntime | undefined
): Record<string, StepState> {
  if (!runtime) {
    return {}
  }

  const stepStates = deserializeStepResponses(runtime.stepResponsesJson)

  for (const aiState of runtime.stepAiStates) {
    stepStates[String(aiState.stepOrder)] = aiState as SessionAiStepState
  }

  return stepStates
}

function mapSessionStep(step: {
  order: number
  type: StepType
  contentJson: SessionStepPayload
}): Step {
  const payload = step.contentJson

  return {
    id: String(step.order),
    type: step.type,
    order: step.order,
    content: payload.content as StepContent,
    cta: {
      label: payload.cta?.label ?? "다음",
      variant: payload.cta?.variant === "secondary" ? "secondary" : "primary",
    },
  }
}
