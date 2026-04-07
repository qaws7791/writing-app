declare const brandSymbol: unique symbol

/**
 * Gives primitive runtime values stable domain meaning at compile time.
 */
export type Brand<TValue, TName extends string> = TValue & {
  readonly [brandSymbol]: TName
}

export type UserId = Brand<string, "user-id">
export type PromptId = Brand<number, "prompt-id">
export type WritingId = Brand<number, "writing-id">
export type JourneyId = Brand<number, "journey-id">
export type SessionId = Brand<number, "session-id">
export type StepId = Brand<number, "step-id">

export function unsafeBrand<TValue, TName extends string>(
  value: TValue
): Brand<TValue, TName> {
  return value as Brand<TValue, TName>
}

export function toUserId(value: string): UserId {
  return unsafeBrand<string, "user-id">(value)
}

export function toPromptId(value: number): PromptId {
  return unsafeBrand<number, "prompt-id">(value)
}

export function toWritingId(value: number): WritingId {
  return unsafeBrand<number, "writing-id">(value)
}

export function toJourneyId(value: number): JourneyId {
  return unsafeBrand<number, "journey-id">(value)
}

export function toSessionId(value: number): SessionId {
  return unsafeBrand<number, "session-id">(value)
}

export function toStepId(value: number): StepId {
  return unsafeBrand<number, "step-id">(value)
}
