import { createValidationError } from "../../../shared/error/index"
import type {
  SessionStepContentType,
  StepSummary,
} from "../../journeys/journey-types"
import type { StepResponse, StepResponseMap } from "../progress-types"

export function extractTextResponse(
  response: StepResponse | undefined
): string | null {
  if (
    response === undefined ||
    (response.type !== "SHORT_ANSWER" &&
      response.type !== "WRITING" &&
      response.type !== "REWRITING")
  ) {
    return null
  }

  const trimmed = response.text.trim()
  return trimmed.length > 0 ? trimmed : null
}

function resolveExpectedResponseType(
  step: StepSummary
): StepResponse["type"] | null {
  const payloadType: SessionStepContentType =
    step.contentJson.type ?? step.contentJson.content.type

  switch (payloadType) {
    case "MULTIPLE_CHOICE":
    case "FILL_IN_THE_BLANK":
    case "ORDERING":
    case "HIGHLIGHT":
    case "SHORT_ANSWER":
    case "WRITING":
    case "REWRITING":
      return payloadType
    default:
      return null
  }
}

export function validateStepResponse(
  step: StepSummary,
  response: StepResponse | undefined
): StepResponse | undefined {
  const expectedResponseType = resolveExpectedResponseType(step)

  if (expectedResponseType === null) {
    if (response !== undefined) {
      throw createValidationError(
        "응답을 제출할 수 없는 스텝입니다.",
        "response"
      )
    }

    return undefined
  }

  if (response === undefined || response.type !== expectedResponseType) {
    throw createValidationError(
      "현재 스텝 타입과 맞지 않는 응답입니다.",
      "response"
    )
  }

  return response
}

export function applyStepResponse(
  current: StepResponseMap,
  stepOrder: number,
  response: StepResponse | undefined
): StepResponseMap {
  if (response === undefined) {
    return current
  }

  return {
    ...current,
    [String(stepOrder)]: response,
  }
}
