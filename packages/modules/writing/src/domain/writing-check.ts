import { writingCheckResultSchema } from "@workspace/contracts/writing/writing"

import { countWritingChars } from "#writing/domain/writing"

export type WritingCheckResult = Readonly<{
  revisions: readonly Readonly<{
    example: string
    location: string
    reason: string
  }>[]
  strengths: readonly string[]
  unmetRequirements: readonly string[]
}>

export type WritingCheckGateError =
  | Readonly<{ kind: "writing-ai-notice-required" }>
  | Readonly<{ kind: "writing-check-daily-limit" }>
  | Readonly<{ kind: "writing-check-min-chars"; minChars: number }>

export function parseWritingCheckResult(
  value: unknown
): WritingCheckResult | null {
  const parsed = writingCheckResultSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function readWritingCheckGate(input: {
  readonly acknowledgedNotice: boolean
  readonly body: string
  readonly dailyChecksRemaining: number
  readonly minChars: number
}): WritingCheckGateError | null {
  if (!input.acknowledgedNotice) {
    return { kind: "writing-ai-notice-required" }
  }
  if (countWritingChars(input.body) < input.minChars) {
    return { kind: "writing-check-min-chars", minChars: input.minChars }
  }
  if (input.dailyChecksRemaining <= 0) {
    return { kind: "writing-check-daily-limit" }
  }
  return null
}

export function canCompleteWriting(input: {
  readonly hasValidCheck: boolean
}): boolean {
  return input.hasValidCheck
}
