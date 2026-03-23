import type { DraftContent } from "../../shared/schema/index"
import { extractDraftTextMetrics } from "../../shared/utilities/draft-content-utilities"
import type { Operation, Writing } from "./writing-types"

export function applyOperationsToContent(
  content: DraftContent,
  title: string,
  operations: Operation[]
): { content: DraftContent; title: string } {
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

export function computeWritingMetrics(content: DraftContent) {
  return extractDraftTextMetrics(content)
}

export function advanceWritingVersion(
  writing: Writing,
  content: DraftContent,
  title: string,
  newVersion: number,
  now: string
): Writing {
  const metrics = extractDraftTextMetrics(content)

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
