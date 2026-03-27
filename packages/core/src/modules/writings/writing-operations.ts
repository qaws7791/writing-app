import type { WritingContent } from "../../shared/schema/index"
import { extractWritingTextMetrics } from "../../shared/utilities/writing-content-utilities"
import type { WritingId, PromptId } from "../../shared/brand/index"
import type { Operation, Writing, WritingFull } from "./writing-types"

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

export function createPreview(
  plainText: string,
  maxLength: number = 100
): string {
  return plainText.length > maxLength
    ? plainText.slice(0, maxLength)
    : plainText
}

export function buildWriting(
  id: WritingId,
  title: string,
  content: WritingContent,
  sourcePromptId: PromptId | null,
  now: string
): WritingFull {
  const metrics = extractWritingTextMetrics(content)
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

export function updateWritingContent(
  writing: WritingFull,
  content: WritingContent,
  now: string
): WritingFull {
  const metrics = extractWritingTextMetrics(content)
  return {
    ...writing,
    content,
    ...metrics,
    preview: createPreview(metrics.plainText),
    updatedAt: now,
  }
}

export function updateWritingTitle(
  writing: WritingFull,
  title: string,
  now: string
): WritingFull {
  return { ...writing, title, updatedAt: now }
}
