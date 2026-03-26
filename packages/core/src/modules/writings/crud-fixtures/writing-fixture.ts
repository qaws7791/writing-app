import type { WritingContent } from "../../../shared/schema/index"
import { toWritingId, toPromptId } from "../../../shared/brand/index"
import type { WritingFull } from "../writing-types"

/**
 * Test fixture builder for WritingFull.
 */
export class WritingFixtureBuilder {
  private writing: WritingFull

  constructor() {
    this.writing = {
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
  }

  withId(id: number): this {
    this.writing = { ...this.writing, id: toWritingId(id) }
    return this
  }

  withTitle(title: string): this {
    this.writing = { ...this.writing, title }
    return this
  }

  withContent(content: WritingContent): this {
    this.writing = { ...this.writing, content }
    return this
  }

  withPlainText(plainText: string, wordCount?: number): this {
    this.writing = {
      ...this.writing,
      plainText,
      characterCount: plainText.length,
      wordCount: wordCount ?? plainText.split(/\s+/).length,
    }
    return this
  }

  withSourcePromptId(promptId: number | null): this {
    this.writing = {
      ...this.writing,
      sourcePromptId: promptId ? toPromptId(promptId) : null,
    }
    return this
  }

  build(): WritingFull {
    return this.writing
  }
}

export function createTestWriting(): WritingFull {
  return new WritingFixtureBuilder().build()
}
