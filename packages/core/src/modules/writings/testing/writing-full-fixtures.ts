import type { WritingContent } from "../../../shared/schema/index"
import { toWritingId, toPromptId } from "../../../shared/brand/index"
import type { WritingFull } from "../writing-types"

const defaultWritingFull: WritingFull = {
  characterCount: 0,
  content: { content: [{ type: "paragraph" }], type: "doc" },
  createdAt: "2026-03-21T00:00:00Z",
  id: toWritingId(1),
  lastSavedAt: "2026-03-21T00:00:00Z",
  plainText: "",
  preview: "",
  sourcePromptId: null,
  title: "Untitled",
  updatedAt: "2026-03-21T00:00:00Z",
  wordCount: 0,
}

type WritingFullOverrides = {
  readonly characterCount?: number
  readonly content?: WritingContent
  readonly createdAt?: string
  readonly id?: number
  readonly lastSavedAt?: string
  readonly plainText?: string
  readonly preview?: string
  readonly sourcePromptId?: number | null
  readonly title?: string
  readonly updatedAt?: string
  readonly wordCount?: number
}

export function createTestWritingFull(
  overrides: WritingFullOverrides = {}
): WritingFull {
  return {
    ...defaultWritingFull,
    ...(overrides.id !== undefined && { id: toWritingId(overrides.id) }),
    ...(overrides.title !== undefined && { title: overrides.title }),
    ...(overrides.content !== undefined && { content: overrides.content }),
    ...(overrides.plainText !== undefined && {
      plainText: overrides.plainText,
      characterCount: overrides.characterCount ?? overrides.plainText.length,
      wordCount:
        overrides.wordCount ??
        overrides.plainText.split(/\s+/).filter((w) => w.length > 0).length,
    }),
    ...(overrides.sourcePromptId !== undefined && {
      sourcePromptId:
        overrides.sourcePromptId !== null
          ? toPromptId(overrides.sourcePromptId)
          : null,
    }),
    ...(overrides.createdAt !== undefined && {
      createdAt: overrides.createdAt,
    }),
    ...(overrides.updatedAt !== undefined && {
      updatedAt: overrides.updatedAt,
    }),
    ...(overrides.lastSavedAt !== undefined && {
      lastSavedAt: overrides.lastSavedAt,
    }),
    ...(overrides.preview !== undefined && { preview: overrides.preview }),
  }
}
