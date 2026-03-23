import type { DraftContent, DraftMark, DraftNode } from "./web-types"

export function createEmptyDraftContent(): DraftContent {
  return {
    content: [{ type: "paragraph" }],
    type: "doc",
  }
}

function applyMarks(text: string, marks?: DraftMark[]): string {
  if (!marks || marks.length === 0) {
    return text
  }

  return marks.reduce((result, mark) => {
    if (mark.type === "bold") {
      return `<strong>${result}</strong>`
    }

    if (mark.type === "italic") {
      return `<em>${result}</em>`
    }

    return result
  }, text)
}

function nodeToHtml(node: DraftNode): string {
  if (node.type === "text") {
    return applyMarks(node.text ?? "", node.marks)
  }

  const children = (node.content ?? []).map(nodeToHtml).join("")

  switch (node.type) {
    case "paragraph":
      return `<p>${children || "<br />"}</p>`
    case "heading":
      return `<h2>${children}</h2>`
    case "blockquote":
      return `<blockquote>${children}</blockquote>`
    case "listItem":
      return `<li>${children}</li>`
    case "bulletList":
      return `<ul>${children}</ul>`
    case "orderedList":
      return `<ol>${children}</ol>`
    default:
      return children
  }
}

function collectText(node: DraftContent | DraftNode, parts: string[]): void {
  if ("text" in node && typeof node.text === "string") {
    parts.push(node.text)
  }

  const content = node.content ?? []
  content.forEach((child, index) => {
    collectText(child, parts)
    const isLast = index === content.length - 1
    if (!isLast && child.type === "paragraph") {
      parts.push("\n")
    }
  })
}

export function draftContentToPlainText(content: DraftContent): string {
  const parts: string[] = []
  collectText(content, parts)

  return parts
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function draftContentToHtml(content: DraftContent): string {
  return (content.content ?? []).map(nodeToHtml).join("") || "<p><br /></p>"
}

export function getDraftMetrics(content: DraftContent): {
  characterCount: number
  plainText: string
  preview: string
  wordCount: number
} {
  const plainText = draftContentToPlainText(content)

  return {
    characterCount: plainText.length,
    plainText,
    preview:
      plainText.length <= 140 ? plainText : `${plainText.slice(0, 140)}...`,
    wordCount:
      plainText.length === 0
        ? 0
        : plainText.split(/\s+/).filter(Boolean).length,
  }
}
