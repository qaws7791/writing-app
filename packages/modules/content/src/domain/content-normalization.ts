import { err, ok, type Result } from "@workspace/kernel/result"

import type { ContentError } from "#content/domain/content-error"

type JsonObject = { [key: string]: unknown }

export function normalizeVersionedStepContent(
  stepId: string,
  stepType: string,
  contentJson: string
): Result<string, ContentError> {
  const parsed = parseJsonObject(contentJson)
  if (parsed === null) {
    return err({
      kind: "content-validation-failed",
      reason: "invalid-step-content",
    })
  }

  try {
    switch (stepType) {
      case "MULTIPLE_CHOICE":
        normalizeMultipleChoice(stepId, parsed)
        break
      case "FILL_BLANK": {
        const words = readArray(parsed, "words")
        const wordIds = ensureIds(stepId, "word", words, parsed["wordIds"])
        parsed["wordIds"] = wordIds
        parsed["answer"] = resolveStableIds(
          words,
          wordIds,
          readArray(parsed, "answer")
        )
        break
      }
      case "SELECT": {
        const segments = readArray(parsed, "segments")
        const segmentIds = ensureIds(
          stepId,
          "segment",
          segments,
          parsed["segmentIds"]
        )
        parsed["segmentIds"] = segmentIds
        parsed["correct"] = resolveIndexedOrStableIds(
          segmentIds,
          readArray(parsed, "correct")
        )
        break
      }
      case "ORDER": {
        const items = readArray(parsed, "items")
        const itemIds = ensureIds(stepId, "item", items, parsed["itemIds"])
        parsed["itemIds"] = itemIds
        parsed["correct"] = resolveStableIds(
          items,
          itemIds,
          readArray(parsed, "correct")
        )
        break
      }
      case "MATCH":
        normalizeMatchPairs(stepId, parsed)
        break
      case "CATEGORIZE":
        normalizeCategorize(stepId, parsed)
        break
    }
  } catch {
    return err({
      kind: "content-validation-failed",
      reason: "invalid-step-content",
    })
  }

  return ok(JSON.stringify(parsed))
}

export function normalizeVersionedStepContentOrThrow(
  stepId: string,
  stepType: string,
  contentJson: string
): string {
  const normalized = normalizeVersionedStepContent(
    stepId,
    stepType,
    contentJson
  )
  if (normalized.isErr()) {
    throw new Error(`Invalid step content for ${stepId}`)
  }
  return normalized.value
}

function normalizeMultipleChoice(stepId: string, content: JsonObject): void {
  const options = readObjectArray(content, "options")
  const oldCorrect = content["correct"]

  options.forEach((option, index) => {
    if (!isNonEmptyString(option["id"])) {
      option["id"] = createItemId(stepId, "option", index)
    }
  })

  if (typeof oldCorrect === "string") {
    const correctOption = options.find(
      (option) => option["id"] === oldCorrect || option["text"] === oldCorrect
    )
    if (correctOption !== undefined) content["correct"] = correctOption["id"]
  }
}

function normalizeMatchPairs(stepId: string, content: JsonObject): void {
  readObjectArray(content, "pairs").forEach((pair, index) => {
    if (!isNonEmptyString(pair["leftId"])) {
      pair["leftId"] = createItemId(stepId, "left", index)
    }
    if (!isNonEmptyString(pair["rightId"])) {
      pair["rightId"] = createItemId(stepId, "right", index)
    }
  })
}

function normalizeCategorize(stepId: string, content: JsonObject): void {
  const categories = readObjectArray(content, "categories")
  const categoryIdMap = new Map<string, string>()

  categories.forEach((category, index) => {
    const oldId = category["id"]
    const nextId = isNonEmptyString(oldId)
      ? oldId
      : createItemId(stepId, "category", index)
    category["id"] = nextId
    if (typeof oldId === "string") categoryIdMap.set(oldId, nextId)
  })

  readObjectArray(content, "items").forEach((item, index) => {
    if (!isNonEmptyString(item["id"])) {
      item["id"] = createItemId(stepId, "item", index)
    }
    const categoryId = item["categoryId"]
    if (typeof categoryId === "string" && categoryIdMap.has(categoryId)) {
      item["categoryId"] = categoryIdMap.get(categoryId)
    }
  })
}

function ensureIds(
  stepId: string,
  kind: string,
  items: readonly unknown[],
  currentIds: unknown
): readonly string[] {
  if (
    Array.isArray(currentIds) &&
    currentIds.length === items.length &&
    currentIds.every(isNonEmptyString) &&
    new Set(currentIds).size === currentIds.length
  ) {
    return currentIds
  }

  return items.map((_, index) => createItemId(stepId, kind, index))
}

function resolveStableIds(
  displayValues: readonly unknown[],
  stableIds: readonly string[],
  expectedValues: readonly unknown[]
): readonly string[] {
  const remaining = displayValues.map((displayValue, index) => ({
    displayValue,
    stableId: stableIds[index],
  }))

  return expectedValues.map((expectedValue) => {
    const index = remaining.findIndex(
      (item) =>
        item.stableId === expectedValue || item.displayValue === expectedValue
    )
    const item = remaining[index]
    if (index < 0 || item?.stableId === undefined) {
      throw new Error("Expected value does not reference a stable item ID")
    }
    remaining.splice(index, 1)
    return item.stableId
  })
}

function resolveIndexedOrStableIds(
  stableIds: readonly string[],
  expectedValues: readonly unknown[]
): readonly string[] {
  return expectedValues.map((expectedValue) => {
    if (
      typeof expectedValue === "string" &&
      stableIds.includes(expectedValue)
    ) {
      return expectedValue
    }
    if (
      typeof expectedValue === "number" &&
      Number.isInteger(expectedValue) &&
      expectedValue >= 0
    ) {
      const stableId = stableIds[expectedValue]
      if (stableId !== undefined) return stableId
    }
    throw new Error("Expected value does not reference a stable item ID")
  })
}

function createItemId(stepId: string, kind: string, index: number): string {
  return `${stepId}:${kind}:${index + 1}`
}

function readArray(content: JsonObject, field: string): readonly unknown[] {
  const value = content[field]
  if (!Array.isArray(value)) throw new Error("Expected an array")
  return value
}

function readObjectArray(content: JsonObject, field: string): JsonObject[] {
  return readArray(content, field).map((item) => {
    if (!isJsonObject(item)) throw new Error("Expected an object")
    return item
  })
}

export function parseJsonObject(value: string): JsonObject | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return isJsonObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}
