import type { AiFeedback } from "#ai-feedback/domain/ai-feedback"
import { validateAiFeedbackProviderResponse } from "#ai-feedback/domain/ai-feedback"

const storedFeedbackKeys = new Set([
  "improvements",
  "nextAction",
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
    Object.keys(parsed).some((key) => !storedFeedbackKeys.has(key))
  ) {
    throw new Error("Stored AI feedback result is invalid")
  }

  const response = validateAiFeedbackProviderResponse(parsed)
  if (response.isErr()) throw new Error("Stored AI feedback result is invalid")

  return response.value
}

function isUnknownRecord(
  value: unknown
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
