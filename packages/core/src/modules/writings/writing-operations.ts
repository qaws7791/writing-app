import type { WritingContent } from "../../shared/schema/index"
import { extractWritingTextMetrics } from "../../shared/utilities/writing-content-utilities"
import type { Operation, Writing } from "./writing-types"

export function applyOperationsToContent(
  content: WritingContent,
  title: string,
  operations: Operation[]
): { content: WritingContent; title: string } {
  let currentContent = content
  let currentTitle = title

  for (const op of operations) {
    switch (op.type) {
      case "setContent":
        currentContent = op.content
        break
      case "setTitle":
        currentTitle = op.title
        break
    }
  }

  return { content: currentContent, title: currentTitle }
}

export function computeWritingMetrics(content: WritingContent) {
  return extractWritingTextMetrics(content)
}

export function advanceWritingVersion(
  writing: Writing,
  content: WritingContent,
  title: string,
  newVersion: number,
  now: string
): Writing {
  const metrics = extractWritingTextMetrics(content)

  return {
    ...writing,
    content,
    title,
    version: newVersion,
    plainText: metrics.plainText,
    characterCount: metrics.characterCount,
    wordCount: metrics.wordCount,
    updatedAt: now,
    lastSavedAt: now,
  }
}

// Re-export CRUD operations
export {
  buildWriting,
  createPreview,
  updateWritingContent,
  updateWritingTitle,
} from "./writing-crud-operations"
