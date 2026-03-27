import type {
  WritingContent,
  TiptapNode,
} from "../schema/writing-content-schema"

/**
 * Creates an empty, valid WritingFull content structure.
 * Initializes with a single paragraph node.
 */
export function createEmptyWritingContent(): WritingContent {
  return {
    content: [{ type: "paragraph" }],
    type: "doc",
  }
}

function collectTextParts(
  node: WritingContent | TiptapNode,
  buffer: string[]
): void {
  if ("text" in node && typeof node.text === "string") {
    buffer.push(node.text)
  }

  if (!node.content || node.content.length === 0) {
    return
  }

  node.content.forEach((child, index) => {
    collectTextParts(child, buffer)

    const isLastChild = index === node.content!.length - 1
    if (!isLastChild && child.type === "paragraph") {
      buffer.push("\n")
    }
  })
}

/**
 * Extracts text metrics from WritingFull content.
 * Calculates word count, character count, and plain text.
 *
 * Returns:
 * - plainText: Full text with preserved newlines
 * - wordCount: Number of words (whitespace-separated)
 * - characterCount: Total characters (including spaces and newlines)
 */
export function extractWritingTextMetrics(content: WritingContent): {
  characterCount: number
  plainText: string
  wordCount: number
} {
  const buffer: string[] = []
  collectTextParts(content, buffer)

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
