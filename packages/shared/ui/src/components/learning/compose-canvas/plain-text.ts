import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
} from "lexical"

function normalizePlainText(text: string): string {
  return text.replaceAll("\r\n", "\n").replaceAll("\r", "\n")
}

export function $importPlainText(text: string): void {
  const root = $getRoot()
  root.clear()
  const lines = normalizePlainText(text).split("\n")
  for (const line of lines) {
    const paragraph = $createParagraphNode()
    if (line.length > 0) {
      paragraph.append($createTextNode(line))
    }
    root.append(paragraph)
  }
}

export function $exportPlainText(): string {
  const children = $getRoot().getChildren()
  if (children.length === 1) {
    const only = children[0]
    if (
      only !== undefined &&
      $isElementNode(only) &&
      only.getTextContent() === ""
    ) {
      return ""
    }
  }
  return children.map((node) => node.getTextContent()).join("\n")
}
