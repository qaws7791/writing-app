import { toDraftId, toUserId } from "../../../shared/brand/index"
import type { DraftContent } from "../../../shared/schema/index"
import type { Writing } from "../writing-types"

const defaultContent: DraftContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "테스트 본문" }],
    },
  ],
}

export function createTestWriting(overrides?: Partial<Writing>): Writing {
  return {
    id: toDraftId(1),
    userId: toUserId("user-1"),
    version: 1,
    title: "테스트 제목",
    content: defaultContent,
    plainText: "테스트 본문",
    characterCount: 5,
    wordCount: 1,
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
    lastSavedAt: "2026-03-20T00:00:00.000Z",
    ...overrides,
  }
}

export const testContent: DraftContent = defaultContent

export const updatedContent: DraftContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "업데이트된 본문" }],
    },
  ],
}
