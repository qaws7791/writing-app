import type { DraftContent } from "../../../shared/schema/index"
import type { DraftId, PromptId } from "../../../shared/brand/index"

/**
 * Immutable draft model.
 * All properties are readonly and derived values are computed on demand.
 */
export type Draft = {
  readonly characterCount: number
  readonly content: DraftContent
  readonly createdAt: string
  readonly id: DraftId
  readonly lastSavedAt: string
  readonly plainText: string
  readonly preview: string
  readonly sourcePromptId: PromptId | null
  readonly title: string
  readonly updatedAt: string
  readonly wordCount: number
}

export function createPreview(
  plainText: string,
  maxLength: number = 100
): string {
  return plainText.length > maxLength
    ? plainText.slice(0, maxLength)
    : plainText
}
