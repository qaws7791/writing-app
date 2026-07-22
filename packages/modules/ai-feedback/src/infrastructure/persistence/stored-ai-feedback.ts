import type { AiFeedback } from "#ai-feedback/domain/ai-feedback"
import { validateAiFeedbackProviderResponse } from "#ai-feedback/domain/ai-feedback"

const storedFeedbackKeys = new Set([
  "improvements",
  "nextAction",
  "score",
  "scoreRange",
  "showScore",
  "strengths",
  "summary",
])

export function validateStoredAiFeedback(value: string | null): AiFeedback {
  if (value === null) throw new Error("Succeeded AI feedback has no result")

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch (cause) {
    throw new Error("Stored AI feedback is not valid JSON", { cause })
  }
  if (
    !isUnknownRecord(parsed) ||
    Object.keys(parsed).some((key) => !storedFeedbackKeys.has(key)) ||
    typeof parsed["showScore"] !== "boolean"
  ) {
    throw new Error("Stored AI feedback result is invalid")
  }
  if (
    !Array.isArray(parsed["scoreRange"]) ||
    parsed["scoreRange"].length !== 2 ||
    parsed["scoreRange"][0] !== 0 ||
    parsed["scoreRange"][1] !== 100
  ) {
    throw new Error("Stored AI feedback score range is invalid")
  }

  const response = validateAiFeedbackProviderResponse({
    improvements: parsed["improvements"],
    nextAction: parsed["nextAction"],
    score: parsed["score"],
    strengths: parsed["strengths"],
    summary: parsed["summary"],
  })
  if (response.isErr()) throw new Error("Stored AI feedback result is invalid")

  const scoreRange = Object.freeze([0, 100] as const)

  return Object.freeze({
    ...response.value,
    scoreRange,
    showScore: parsed["showScore"],
  })
}

function isUnknownRecord(
  value: unknown
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
