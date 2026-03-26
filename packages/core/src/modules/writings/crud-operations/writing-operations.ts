import type { WritingContent } from "../../../shared/schema/index"
import { extractWritingTextMetrics } from "../../../shared/utilities/index"
import type { WritingId, PromptId } from "../../../shared/brand/index"
import type { WritingFull } from "../writing-types"
import { createPreview } from "../writing-crud-operations"

/**
 * Builds a new WritingFull from input.
 * Calculates text metrics and sets initial timestamps.
 * (5 lines per function principle)
 */
export function buildWriting(
  id: WritingId,
  title: string,
  content: WritingContent,
  sourcePromptId: PromptId | null,
  now: string
): WritingFull {
  const metrics = extractWritingTextMetrics(content)
  const preview = createPreview(metrics.plainText)

  return {
    characterCount: metrics.characterCount,
    content,
    createdAt: now,
    id,
    lastSavedAt: now,
    plainText: metrics.plainText,
    preview,
    sourcePromptId,
    title,
    updatedAt: now,
    wordCount: metrics.wordCount,
  }
}

/**
 * Updates WritingFull content and recalculates metrics.
 */
export function updateWritingContent(
  writing: WritingFull,
  content: WritingContent,
  now: string
): WritingFull {
  const metrics = extractWritingTextMetrics(content)
  return {
    ...writing,
    content,
    ...metrics,
    preview: createPreview(metrics.plainText),
    updatedAt: now,
  }
}

/**
 * Updates WritingFull title.
 */
export function updateWritingTitle(
  writing: WritingFull,
  title: string,
  now: string
): WritingFull {
  return { ...writing, title, updatedAt: now }
}

/**
 * Validates WritingFull input before creation.
 */
export function validateCreateWritingInput(
  _title: string | undefined,
  _content: WritingContent | undefined
): null {
  return null
}
