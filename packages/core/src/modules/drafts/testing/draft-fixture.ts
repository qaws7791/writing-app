import type { DraftContent } from "../../../shared/schema/index"
import { toDraftId, toPromptId } from "../../../shared/brand/index"
import type { Draft } from "../draft-types"

const defaultDraft: Draft = {
  characterCount: 0,
  content: { content: [{ type: "paragraph" }], type: "doc" },
  createdAt: "2026-03-21T00:00:00Z",
  id: toDraftId(1),
  lastSavedAt: "2026-03-21T00:00:00Z",
  plainText: "",
  preview: "",
  sourcePromptId: null,
  title: "Untitled",
  updatedAt: "2026-03-21T00:00:00Z",
  wordCount: 0,
}

type DraftOverrides = {
  readonly characterCount?: number
  readonly content?: DraftContent
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

export function createTestDraft(overrides: DraftOverrides = {}): Draft {
  return {
    ...defaultDraft,
    ...(overrides.id !== undefined && { id: toDraftId(overrides.id) }),
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
