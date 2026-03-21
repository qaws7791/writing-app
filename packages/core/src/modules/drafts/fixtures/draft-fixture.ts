import type { DraftContent } from "../../../shared/schema/index"
import { toDraftId, toPromptId } from "../../../shared/brand/index"
import type { Draft } from "../model/index"

/**
 * Test fixture builder for Draft.
 */
export class DraftFixtureBuilder {
  private draft: Draft

  constructor() {
    this.draft = {
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
  }

  withId(id: number): this {
    this.draft = { ...this.draft, id: toDraftId(id) }
    return this
  }

  withTitle(title: string): this {
    this.draft = { ...this.draft, title }
    return this
  }

  withContent(content: DraftContent): this {
    this.draft = { ...this.draft, content }
    return this
  }

  withPlainText(plainText: string, wordCount?: number): this {
    this.draft = {
      ...this.draft,
      plainText,
      characterCount: plainText.length,
      wordCount: wordCount ?? plainText.split(/\s+/).length,
    }
    return this
  }

  withSourcePromptId(promptId: number | null): this {
    this.draft = {
      ...this.draft,
      sourcePromptId: promptId ? toPromptId(promptId) : null,
    }
    return this
  }

  build(): Draft {
    return this.draft
  }
}

export function createTestDraft(): Draft {
  return new DraftFixtureBuilder().build()
}
