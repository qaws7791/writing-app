import { err, ok, type Result } from "@workspace/kernel/result"

const outputTextMaxLength = 4_000
const outputCollectionMaxLength = 20
const providerResponseKeys = new Set([
  "improvements",
  "nextAction",
  "score",
  "strengths",
  "summary",
])

export type AiFeedbackProviderResponse = Readonly<{
  improvements: readonly string[]
  nextAction: string
  score: number
  strengths: readonly string[]
  summary: string
}>

export type AiFeedback = AiFeedbackProviderResponse &
  Readonly<{
    scoreRange: readonly [0, 100]
    showScore: boolean
  }>

export type AiFeedbackProviderResponseError = Readonly<{
  kind: "provider-response-invalid"
}>

export function validateAiFeedbackProviderResponse(
  value: unknown
): Result<AiFeedbackProviderResponse, AiFeedbackProviderResponseError> {
  if (!isUnknownRecord(value)) return invalidResponse()
  if (Object.keys(value).some((key) => !providerResponseKeys.has(key))) {
    return invalidResponse()
  }

  const improvements = readTextCollection(value["improvements"])
  const nextAction = readText(value["nextAction"])
  const score = value["score"]
  const strengths = readTextCollection(value["strengths"])
  const summary = readText(value["summary"])

  if (
    improvements === null ||
    nextAction === null ||
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    strengths === null ||
    summary === null
  ) {
    return invalidResponse()
  }

  return ok(
    Object.freeze({
      improvements,
      nextAction,
      score,
      strengths,
      summary,
    })
  )
}

export function createAiFeedback(
  response: AiFeedbackProviderResponse,
  showScore: boolean
): AiFeedback {
  const scoreRange = Object.freeze([0, 100] as const)
  return Object.freeze({
    ...response,
    improvements: Object.freeze([...response.improvements]),
    scoreRange,
    showScore,
    strengths: Object.freeze([...response.strengths]),
  })
}

function invalidResponse(): Result<never, AiFeedbackProviderResponseError> {
  return err({ kind: "provider-response-invalid" })
}

function readText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= outputTextMaxLength
    ? normalized
    : null
}

function readTextCollection(value: unknown): readonly string[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > outputCollectionMaxLength
  ) {
    return null
  }

  const items = value.map(readText)
  return items.some((item) => item === null)
    ? null
    : Object.freeze(items.map((item) => item ?? ""))
}

function isUnknownRecord(
  value: unknown
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
