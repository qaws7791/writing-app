import type { SessionStepPayload } from "@workspace/core/modules/journeys"

import {
  deserializeStepResponses,
  fetchSessionDetail,
} from "@/features/sessions"
import type {
  Session,
  SessionAiStepState,
  Step,
  StepContentMap,
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

  switch (step.type) {
    case "INTRO":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["INTRO"],
        cta: createStepCta(payload.cta),
      }
    case "COMPLETION":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["COMPLETION"],
        cta: createStepCta(payload.cta),
      }
    case "CONCEPT":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["CONCEPT"],
        cta: createStepCta(payload.cta),
      }
    case "EXAMPLE":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["EXAMPLE"],
        cta: createStepCta(payload.cta),
      }
    case "MULTIPLE_CHOICE":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["MULTIPLE_CHOICE"],
        cta: createStepCta(payload.cta),
      }
    case "FILL_IN_THE_BLANK":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["FILL_IN_THE_BLANK"],
        cta: createStepCta(payload.cta),
      }
    case "ORDERING":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["ORDERING"],
        cta: createStepCta(payload.cta),
      }
    case "HIGHLIGHT":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["HIGHLIGHT"],
        cta: createStepCta(payload.cta),
      }
    case "SHORT_ANSWER":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["SHORT_ANSWER"],
        cta: createStepCta(payload.cta),
      }
    case "WRITING":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["WRITING"],
        cta: createStepCta(payload.cta),
      }
    case "REWRITING":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["REWRITING"],
        cta: createStepCta(payload.cta),
      }
    case "AI_FEEDBACK":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["AI_FEEDBACK"],
        cta: createStepCta(payload.cta),
      }
    case "AI_COMPARISON":
      return {
        id: String(step.order),
        type: step.type,
        order: step.order,
        content: payload.content as StepContentMap["AI_COMPARISON"],
        cta: createStepCta(payload.cta),
      }
  }
}

function createStepCta(payload: SessionStepPayload["cta"]) {
  return {
    label: payload?.label ?? "다음",
    variant: payload?.variant === "secondary" ? "secondary" : "primary",
  } as const
}
