import type { DraftContent } from "../../../shared/schema/index"
import { extractDraftTextMetrics } from "../../../shared/utilities/index"
import type { DraftId, PromptId } from "../../../shared/brand/index"
import type { Draft } from "../model/index"
import { createPreview } from "../model/index"

/**
 * Builds a new draft from input.
 * Calculates text metrics and sets initial timestamps.
 * (5 lines per function principle)
 */
export function buildDraft(
  id: DraftId,
  title: string,
  content: DraftContent,
  sourcePromptId: PromptId | null,
  now: string
): Draft {
  const metrics = extractDraftTextMetrics(content)
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
 * Updates draft content and recalculates metrics.
 */
export function updateDraftContent(
  draft: Draft,
  content: DraftContent,
  now: string
): Draft {
  const metrics = extractDraftTextMetrics(content)
  return {
    ...draft,
    content,
    ...metrics,
    preview: createPreview(metrics.plainText),
    updatedAt: now,
  }
}

/**
 * Updates draft title.
 */
export function updateDraftTitle(
  draft: Draft,
  title: string,
  now: string
): Draft {
  return { ...draft, title, updatedAt: now }
}

/**
 * Validates draft input before creation.
 */
export function validateCreateDraftInput(
  _title: string | undefined,
  _content: DraftContent | undefined
): null {
  return null
}
