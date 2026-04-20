import type { paths } from "@workspace/api-client"

import {
  deserializeStepResponse,
  serializeStepState,
} from "@/views/session-detail-view/step-registry"
import type { Step, StepState } from "@/views/session-detail-view/types"

type SessionRuntime =
  paths["/sessions/{sessionId}"]["get"]["responses"][200]["content"]["application/json"]

type SubmitStepBody =
  paths["/sessions/{sessionId}/steps/{stepOrder}/submit"]["post"]["requestBody"]["content"]["application/json"]

export type SessionStepResponse = Exclude<SubmitStepBody["response"], undefined>

export function serializeStepResponse(
  step: Step,
  state: StepState
): SessionStepResponse | undefined {
  return serializeStepState(step, state)
}

export function deserializeStepResponses(
  stepResponsesJson: SessionRuntime["stepResponsesJson"]
): Record<string, StepState> {
  return Object.fromEntries(
    Object.entries(stepResponsesJson).map(([stepId, response]) => [
      stepId,
      deserializeStepResponse(response),
    ])
  )
}
