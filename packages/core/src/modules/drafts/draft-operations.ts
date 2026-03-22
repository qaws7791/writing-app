import type { DraftContent } from "../../shared/schema/index"
import { extractDraftTextMetrics } from "../../shared/utilities/draft-content-utilities"
import type { DraftId, PromptId } from "../../shared/brand/index"
import type { Draft } from "./draft-types"

export function createPreview(
  plainText: string,
  maxLength: number = 100
): string {
  return plainText.length > maxLength
    ? plainText.slice(0, maxLength)
    : plainText
}

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

export function updateDraftTitle(
  draft: Draft,
  title: string,
  now: string
): Draft {
  return { ...draft, title, updatedAt: now }
}
