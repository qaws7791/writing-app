import { createValidationError } from "../../../shared/error/index"
import type { StepSummary } from "../../journeys/journey-types"
import type {
  SessionAiStateKind,
  StepResponse,
  StepResponseMap,
} from "../progress-types"
import { extractTextResponse } from "./submit-step-response"

function getContent(step: StepSummary): Record<string, unknown> {
  return step.contentJson.content
}

export function shouldQueueAiStep(
  currentStep: StepSummary,
  nextStep: StepSummary | undefined
): nextStep is StepSummary {
  if (!nextStep) {
    return false
  }

  return (
    (currentStep.type === "WRITING" && nextStep.type === "AI_FEEDBACK") ||
    (currentStep.type === "REWRITING" && nextStep.type === "AI_COMPARISON")
  )
}

export function resolveAiKind(step: StepSummary): SessionAiStateKind {
  return step.contentJson.content.type === "AI_COMPARISON"
    ? "comparison"
    : "feedback"
}

export function buildAiQueueInput(input: {
  currentStep: StepSummary
  nextStep: StepSummary
  response: StepResponse | undefined
  stepResponses: StepResponseMap
}): {
  inputJson: Record<string, unknown>
  kind: SessionAiStateKind
} {
  const kind = resolveAiKind(input.nextStep)
  const submittedText = extractTextResponse(input.response)

  if (submittedText === null) {
    throw createValidationError(
      "AI 분석을 위해 텍스트 응답이 필요합니다.",
      "response"
    )
  }

  if (kind === "feedback") {
    return {
      kind,
      inputJson: {
        bodyPlainText: submittedText,
        level: "beginner",
      },
    }
  }

  const content = getContent(input.currentStep)
  const originalStepId = content.originalWritingStepId
  const originalResponse =
    typeof originalStepId === "string"
      ? input.stepResponses[originalStepId]
      : undefined
  const originalText = extractTextResponse(originalResponse)

  if (originalText === null) {
    throw createValidationError("비교 분석을 위한 초안이 없습니다.", "response")
  }

  return {
    kind,
    inputJson: {
      originalText,
      revisedText: submittedText,
    },
  }
}
