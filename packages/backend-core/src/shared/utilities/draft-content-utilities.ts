import type { DraftContent, TiptapNode } from "../schema/draft-content-schema"

/**
 * Creates an empty, valid draft content structure.
 * Initializes with a single paragraph node.
 */
export function createEmptyDraftContent(): DraftContent {
  return {
    content: [{ type: "paragraph" }],
    type: "doc",
  }
}

/**
 * Extracts all text from draft content.
 * Preserves newlines between paragraphs.
 */
function collectTextParts(
  node: DraftContent | TiptapNode,
  buffer: string[],
  insideBlock: boolean
): void {
  if ("text" in node && typeof node.text === "string") {
    buffer.push(node.text)
  }

  if (!node.content || node.content.length === 0) {
    return
  }

  node.content.forEach((child, index) => {
    collectTextParts(child, buffer, child.type === "paragraph")

    const isLastChild = index === node.content!.length - 1
    if (!isLastChild && (child.type === "paragraph" || insideBlock)) {
      buffer.push("\n")
    }
  })
}

/**
 * Extracts text metrics from draft content.
 * Calculates word count, character count, and plain text.
 *
 * Returns:
 * - plainText: Full text with preserved newlines
 * - wordCount: Number of words (whitespace-separated)
 * - characterCount: Total characters (including spaces and newlines)
 */
export function extractDraftTextMetrics(content: DraftContent): {
  characterCount: number
  plainText: string
  wordCount: number
} {
  const buffer: string[] = []
  collectTextParts(content, buffer, false)

  const plainText = buffer.join("")
  const characterCount = plainText.length

  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)

  const wordCount = words.length

  return {
    characterCount,
    plainText,
    wordCount,
  }
}
