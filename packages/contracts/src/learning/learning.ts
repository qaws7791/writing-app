import { z } from "zod"

export type JsonPrimitive = string | number | boolean | null
export type JsonArray = readonly JsonValue[]
export type JsonObject = {
  readonly [key: string]: JsonValue
}
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

export const learningAnswerTextMaxLength = 20_000
export const learningAnswerCollectionMaxLength = 100

export const jsonValueSchema = z.custom<JsonValue>(isBoundedJsonValue, {
  message: "JSON 값이 허용된 깊이 또는 크기를 초과했습니다.",
})

function isBoundedJsonValue(value: unknown): value is JsonValue {
  const pending: Array<{ readonly depth: number; readonly value: unknown }> = [
    { depth: 0, value },
  ]
  let visitedNodeCount = 0

  while (pending.length > 0) {
    const current = pending.pop()

    if (current === undefined) {
      break
    }

    visitedNodeCount += 1

    if (current.depth > 16 || visitedNodeCount > 1_000) {
      return false
    }

    if (
      current.value === null ||
      typeof current.value === "boolean" ||
      (typeof current.value === "number" && Number.isFinite(current.value))
    ) {
      continue
    }

    if (typeof current.value === "string") {
      if (current.value.length > learningAnswerTextMaxLength) {
        return false
      }

      continue
    }

    if (Array.isArray(current.value)) {
      if (current.value.length > learningAnswerCollectionMaxLength) {
        return false
      }

      for (const item of current.value) {
        pending.push({ depth: current.depth + 1, value: item })
      }

      continue
    }

    if (typeof current.value !== "object") {
      return false
    }

    const prototype = Object.getPrototypeOf(current.value)

    if (prototype !== Object.prototype && prototype !== null) {
      return false
    }

    const entries = Object.entries(current.value)

    if (entries.length > learningAnswerCollectionMaxLength) {
      return false
    }

    for (const [key, entryValue] of entries) {
      if (key.length > 1_000) {
        return false
      }

      pending.push({ depth: current.depth + 1, value: entryValue })
    }
  }

  return true
}
