import { err, ok, type Result } from "@workspace/kernel/result"

import type { ContentError } from "#content/domain/content-error"

type JsonObject = { [key: string]: unknown }

export type LegacyStepNormalizationContext = Readonly<{
  lessonSteps: readonly Readonly<{
    id: string
    sortOrder: number
    type: string
  }>[]
}>

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
      case "FILL_BLANK":
        parsed["wordIds"] = ensureIds(
          stepId,
          "word",
          readArray(parsed, "words"),
          parsed["wordIds"]
        )
        break
      case "SELECT":
        parsed["segmentIds"] = ensureIds(
          stepId,
          "segment",
          readArray(parsed, "segments"),
          parsed["segmentIds"]
        )
        break
      case "ORDER":
        parsed["itemIds"] = ensureIds(
          stepId,
          "item",
          readArray(parsed, "items"),
          parsed["itemIds"]
        )
        break
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

export function normalizeLegacyVersionedStepContentOrThrow(
  stepId: string,
  stepType: string,
  contentJson: string,
  context?: LegacyStepNormalizationContext
): string {
  const normalized = normalizeVersionedStepContentOrThrow(
    stepId,
    stepType,
    contentJson
  )
  if (stepType === "READING") {
    return normalizeLegacyReadingGuide(stepId, normalized)
  }
  if (stepType === "AI_FEEDBACK") {
    return normalizeLegacyAiFeedbackTarget(stepId, normalized, context)
  }
  return normalized
}

function normalizeLegacyReadingGuide(
  stepId: string,
  contentJson: string
): string {
  const content = parseJsonObject(contentJson)
  if (content === null) throw new Error(`Invalid step content for ${stepId}`)
  if (Object.hasOwn(content, "guide")) return contentJson

  content["guide"] = ""
  return JSON.stringify(content)
}

function normalizeLegacyAiFeedbackTarget(
  stepId: string,
  contentJson: string,
  context: LegacyStepNormalizationContext | undefined
): string {
  const content = parseJsonObject(contentJson)
  if (content === null) throw new Error(`Invalid step content for ${stepId}`)
  if (content["target"] !== "wr") return contentJson

  if (context === undefined) {
    throw new Error(`Legacy AI feedback target cannot resolve step ${stepId}`)
  }
  const step = context.lessonSteps.find((candidate) => candidate.id === stepId)
  if (step === undefined) {
    throw new Error(`Legacy AI feedback target cannot resolve step ${stepId}`)
  }
  const predecessors = context.lessonSteps.filter(
    (candidate) =>
      candidate.type === "WRITE" && candidate.sortOrder < step.sortOrder
  )
  if (predecessors.length === 0) {
    throw new Error(
      `Legacy AI feedback target has no preceding WRITE for ${stepId}`
    )
  }
  if (
    new Set(predecessors.map(({ id }) => id)).size !== predecessors.length ||
    new Set(predecessors.map(({ sortOrder }) => sortOrder)).size !==
      predecessors.length
  ) {
    throw new Error(`Legacy AI feedback target is ambiguous for ${stepId}`)
  }

  const target = predecessors.reduce((nearest, candidate) =>
    candidate.sortOrder > nearest.sortOrder ? candidate : nearest
  )
  content["target"] = target.id
  return JSON.stringify(content)
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
