import {
  $createRangeSelection,
  $getRoot,
  $isElementNode,
  $isTextNode,
  $nodesOfType,
  type ElementNode,
  type RangeSelection,
  type TextNode,
} from "lexical"
import {
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from "@lexical/mark"

export function $findTextRange(quote: string): RangeSelection | null {
  if (quote.length === 0 || quote.includes("\n")) {
    return null
  }

  for (const paragraph of $getRoot().getChildren()) {
    if (!$isElementNode(paragraph)) {
      continue
    }
    const textNodes = $collectTextNodes(paragraph)
    const combined = textNodes.map((node) => node.getTextContent()).join("")
    const index = combined.indexOf(quote)
    if (index < 0) {
      continue
    }
    const start = $mapOffsetToPoint(textNodes, index)
    const end = $mapOffsetToPoint(textNodes, index + quote.length)
    if (start === null || end === null) {
      return null
    }
    const selection = $createRangeSelection()
    selection.anchor.set(start.node.getKey(), start.offset, "text")
    selection.focus.set(end.node.getKey(), end.offset, "text")
    return selection
  }

  return null
}

export function $unwrapFeedbackMark(id: string): void {
  for (const mark of $nodesOfType(MarkNode)) {
    if (!mark.hasID(id)) {
      continue
    }
    mark.deleteID(id)
    if (mark.getIDs().length === 0) {
      $unwrapMarkNode(mark)
    }
  }
}

export function $wrapFeedbackMark(id: string, quote: string): boolean {
  const selection = $findTextRange(quote)
  if (selection === null) {
    return false
  }
  $wrapSelectionInMarkNode(selection, false, id)
  return true
}

function $collectTextNodes(element: ElementNode): TextNode[] {
  const nodes: TextNode[] = []
  const visit = (node: ReturnType<ElementNode["getChildren"]>[number]) => {
    if ($isTextNode(node)) {
      nodes.push(node)
      return
    }
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        visit(child)
      }
    }
  }
  for (const child of element.getChildren()) {
    visit(child)
  }
  return nodes
}

function $mapOffsetToPoint(
  nodes: readonly TextNode[],
  offset: number
): { node: TextNode; offset: number } | null {
  let remaining = offset
  for (const node of nodes) {
    const length = node.getTextContentSize()
    if (remaining < length || (remaining === length && node === nodes.at(-1))) {
      return { node, offset: remaining }
    }
    remaining -= length
  }
  return null
}
