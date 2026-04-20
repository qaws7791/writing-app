import type {
  InputStepState,
  SessionAiStepState,
  StepState,
} from "@/views/session-detail-view/types"

export function getStepState<T extends Exclude<StepState, undefined>>(
  states: Record<string, StepState>,
  stepId: string,
  guard: (value: StepState) => value is T
): T | undefined {
  const value = states[stepId]

  return guard(value) ? value : undefined
}

export function isInputStepState(value: StepState): value is InputStepState {
  return (
    value !== undefined &&
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    "hasInput" in value &&
    typeof value.text === "string" &&
    typeof value.hasInput === "boolean"
  )
}

export function isSelectionStepState(
  value: StepState
): value is Exclude<
  StepState,
  undefined | InputStepState | SessionAiStepState
> {
  return (
    value !== undefined &&
    typeof value === "object" &&
    value !== null &&
    "checked" in value &&
    "hasSelection" in value &&
    typeof value.checked === "boolean" &&
    typeof value.hasSelection === "boolean"
  )
}

export function isSessionAiStepState(
  value: StepState
): value is SessionAiStepState {
  return (
    value !== undefined &&
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "kind" in value
  )
}
