import type { paths } from "@workspace/api-client"

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
  if (state === undefined || state === null || typeof state !== "object") {
    return undefined
  }

  switch (step.type) {
    case "MULTIPLE_CHOICE":
      return "selected" in state && Array.isArray(state.selected)
        ? {
            type: "MULTIPLE_CHOICE",
            selected: state.selected,
          }
        : undefined
    case "FILL_IN_THE_BLANK":
      return "selections" in state &&
        state.selections !== null &&
        typeof state.selections === "object"
        ? {
            type: "FILL_IN_THE_BLANK",
            selections: state.selections,
          }
        : undefined
    case "ORDERING":
      return "order" in state && Array.isArray(state.order)
        ? {
            type: "ORDERING",
            order: state.order,
          }
        : undefined
    case "HIGHLIGHT":
      return "selected" in state && Array.isArray(state.selected)
        ? {
            type: "HIGHLIGHT",
            selected: state.selected,
          }
        : undefined
    case "SHORT_ANSWER":
      return "text" in state && typeof state.text === "string"
        ? {
            type: "SHORT_ANSWER",
            text: state.text,
          }
        : undefined
    case "WRITING":
      return "text" in state && typeof state.text === "string"
        ? {
            type: "WRITING",
            text: state.text,
          }
        : undefined
    case "REWRITING":
      return "text" in state && typeof state.text === "string"
        ? {
            type: "REWRITING",
            text: state.text,
          }
        : undefined
    default:
      return undefined
  }
}

function deserializeStepResponse(
  response: SessionStepResponse
): StepState | undefined {
  switch (response.type) {
    case "MULTIPLE_CHOICE":
      return {
        selected: response.selected,
        hasSelection: response.selected.length > 0,
        checked: true,
      }
    case "FILL_IN_THE_BLANK":
      return {
        selections: response.selections,
        hasSelection: Object.keys(response.selections).length > 0,
        checked: true,
      }
    case "ORDERING":
      return {
        order: response.order,
        hasSelection: response.order.length > 0,
        checked: true,
      }
    case "HIGHLIGHT":
      return {
        selected: response.selected,
        hasSelection: response.selected.length > 0,
        checked: true,
      }
    case "SHORT_ANSWER":
    case "WRITING":
    case "REWRITING":
      return {
        text: response.text,
        hasInput: response.text.length > 0,
      }
  }
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
