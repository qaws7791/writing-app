import { z } from "zod"

declare const brandSymbol: unique symbol

/**
 * Gives primitive runtime values stable domain meaning at compile time.
 */
export type Brand<TValue, TName extends string> = TValue & {
  readonly [brandSymbol]: TName
}

export type UserId = Brand<string, "user-id">

function unsafeBrand<TValue, TName extends string>(
  value: TValue
): Brand<TValue, TName> {
  return value as Brand<TValue, TName>
}

const nonEmptyStringSchema = z.string().min(1)

export const userIdSchema = nonEmptyStringSchema.transform(
  (value): UserId => toUserId(value)
)

/**
 * Trusted constructor. Use only after the boundary has already validated the
 * runtime value.
 */
export function toUserId(value: string): UserId {
  return unsafeBrand<string, "user-id">(value)
}

export function parseUserId(value: string): UserId {
  return userIdSchema.parse(value)
}
