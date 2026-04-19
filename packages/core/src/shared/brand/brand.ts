import { z } from "zod"

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

function unsafeBrand<TValue, TName extends string>(
  value: TValue
): Brand<TValue, TName> {
  return value as Brand<TValue, TName>
}

const positiveIntSchema = z.number().int().positive()
const nonEmptyStringSchema = z.string().min(1)

export const userIdSchema = nonEmptyStringSchema.transform(
  (value): UserId => toUserId(value)
)
export const promptIdSchema = positiveIntSchema.transform(
  (value): PromptId => toPromptId(value)
)
export const writingIdSchema = positiveIntSchema.transform(
  (value): WritingId => toWritingId(value)
)
export const journeyIdSchema = positiveIntSchema.transform(
  (value): JourneyId => toJourneyId(value)
)
export const sessionIdSchema = positiveIntSchema.transform(
  (value): SessionId => toSessionId(value)
)
export const stepIdSchema = positiveIntSchema.transform(
  (value): StepId => toStepId(value)
)

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toUserId(value: string): UserId {
  return unsafeBrand<string, "user-id">(value)
}

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toPromptId(value: number): PromptId {
  return unsafeBrand<number, "prompt-id">(value)
}

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toWritingId(value: number): WritingId {
  return unsafeBrand<number, "writing-id">(value)
}

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toJourneyId(value: number): JourneyId {
  return unsafeBrand<number, "journey-id">(value)
}

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toSessionId(value: number): SessionId {
  return unsafeBrand<number, "session-id">(value)
}

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toStepId(value: number): StepId {
  return unsafeBrand<number, "step-id">(value)
}

export function parseUserId(value: string): UserId {
  return userIdSchema.parse(value)
}

export function parsePromptId(value: number): PromptId {
  return promptIdSchema.parse(value)
}

export function parseWritingId(value: number): WritingId {
  return writingIdSchema.parse(value)
}

export function parseJourneyId(value: number): JourneyId {
  return journeyIdSchema.parse(value)
}

export function parseSessionId(value: number): SessionId {
  return sessionIdSchema.parse(value)
}

export function parseStepId(value: number): StepId {
  return stepIdSchema.parse(value)
}
