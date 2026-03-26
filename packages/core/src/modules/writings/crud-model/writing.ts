import type { WritingContent } from "../../../shared/schema/index"
import type { WritingId, PromptId } from "../../../shared/brand/index"

/**
 * Immutable WritingFull model.
 * All properties are readonly and derived values are computed on demand.
 */
export type WritingFull = {
  readonly characterCount: number
  readonly content: WritingContent
  readonly createdAt: string
  readonly id: WritingId
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
