type JsonObject = { [key: string]: unknown }

/**
 * 기존 step JSON의 선택 항목에 version 사이에서 유지할 결정적 ID를 채운다.
 */
export function normalizeVersionedStepContent(
  stepId: string,
  stepType: string,
  contentJson: string
): string {
  const parsed: unknown = JSON.parse(contentJson)

  if (!isJsonObject(parsed)) {
    throw new Error(`Invalid step content for ${stepId}: object is required`)
  }

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

  return JSON.stringify(parsed)
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

  if (!Array.isArray(value)) {
    throw new Error(`Invalid step content field: ${field} must be an array`)
  }

  return value
}

function readObjectArray(content: JsonObject, field: string): JsonObject[] {
  return readArray(content, field).map((item) => {
    if (!isJsonObject(item)) {
      throw new Error(
        `Invalid step content field: ${field} item must be an object`
      )
    }
    return item
  })
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}
