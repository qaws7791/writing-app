import { $isCodeNode } from "@lexical/code"
import { $isLinkNode, type LinkNode } from "@lexical/link"
import {
  $isListItemNode,
  $isListNode,
  type ListItemNode,
  type ListNode,
} from "@lexical/list"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import {
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  type TableCellNode,
  type TableNode,
  type TableRowNode,
} from "@lexical/table"
import type {
  ElementNode,
  LexicalNode,
  TextFormatType,
  TextModeType,
  TextNode,
} from "lexical"
import {
  $getSlotNames,
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
  IS_ALL_FORMATTING,
  NODE_STATE_KEY,
} from "lexical"

import { $isResourceHorizontalRuleNode } from "#resource-document/resource-horizontal-rule-node"
import {
  $isResourceImageNode,
  type ResourceImageNode,
} from "#resource-document/resource-image-node"
import {
  isAllowedResourceImageUrl,
  isAllowedResourceLinkUrl,
} from "#resource-document/resource-markdown-validation"
import {
  $getResourceTableColumnAlignments,
  isResourceTableColumnAlignments,
  RESOURCE_TABLE_COLUMN_ALIGNMENTS_STATE_KEY,
} from "#resource-document/resource-table-state"

export type ResourceDocumentStructureIssue =
  | {
      readonly childType: string
      readonly code: "unsupported-lexical-hierarchy"
      readonly parentType: string
    }
  | {
      readonly code: "invalid-collaboration-state"
    }
  | {
      readonly code: "invalid-resource-image-property"
      readonly property: "alt" | "url"
    }
  | {
      readonly code: "unsupported-lexical-node"
      readonly nodeType: string
    }
  | {
      readonly code: "unsupported-node-slots"
      readonly nodeType: string
      readonly slots: readonly string[]
    }
  | {
      readonly code: "unsupported-node-state"
      readonly keys: readonly string[]
      readonly nodeType: string
    }
  | {
      readonly code: "unsupported-lexical-property"
      readonly nodeType: string
      readonly property:
        | "background-color"
        | "checked"
        | "col-span"
        | "direction"
        | "format"
        | "frozen-columns"
        | "frozen-rows"
        | "header-state"
        | "height"
        | "indent"
        | "language"
        | "list-type"
        | "rel"
        | "row-span"
        | "row-striping"
        | "start"
        | "style"
        | "syntax-highlight"
        | "tag"
        | "target"
        | "text-format"
        | "text-style"
        | "theme"
        | "title"
        | "type"
        | "value"
        | "vertical-align"
        | "width"
        | "url"
      readonly value: boolean | number | string
    }
  | {
      readonly code: "unsupported-list-item-structure"
    }
  | {
      readonly code: "unsupported-table-column-widths"
      readonly widths: readonly number[]
    }
  | {
      readonly code: "unsupported-table-cell-cardinality"
      readonly children: number
    }
  | {
      readonly alignments: number
      readonly code: "unsupported-table-alignment-count"
      readonly columns: number
    }
  | {
      readonly code: "unsupported-table-dimensions"
      readonly columns: number
      readonly rows: number
    }
  | {
      readonly actual: number
      readonly code: "unsupported-table-row-width"
      readonly expected: number
      readonly row: number
    }
  | {
      readonly code: "unsupported-text-detail"
      readonly detail: number
    }
  | {
      readonly code: "unsupported-text-format"
      readonly format: TextFormatType
    }
  | {
      readonly code: "unsupported-text-format-combination"
      readonly formats: readonly TextFormatType[]
    }
  | {
      readonly code: "unsupported-text-mode"
      readonly mode: TextModeType
    }
  | {
      readonly code: "unsupported-text-style"
      readonly style: string
    }

export type ResourceDocumentStructureValidation =
  | { readonly status: "valid" }
  | {
      readonly issues: readonly ResourceDocumentStructureIssue[]
      readonly status: "invalid"
    }

const supportedTextFormats = [
  "bold",
  "code",
  "italic",
  "strikethrough",
] as const satisfies readonly TextFormatType[]

const unsupportedTextFormats = [
  "underline",
  "highlight",
  "subscript",
  "superscript",
  "lowercase",
  "uppercase",
  "capitalize",
] as const satisfies readonly TextFormatType[]

export function $validateResourceDocumentStructure(): ResourceDocumentStructureValidation {
  const issues: ResourceDocumentStructureIssue[] = []
  const root = $getRoot()

  validateNodeMetadata(root, issues)
  validateNodeType(root, "root", issues)
  validateElementProperties(root, issues)

  for (const child of root.getChildren()) {
    validateLexicalNode(child, root, issues)
  }

  return issues.length === 0
    ? { status: "valid" }
    : { issues, status: "invalid" }
}

function validateLexicalNode(
  node: LexicalNode,
  parent: ElementNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  validateNodeMetadata(node, issues)

  if (!isSupportedLexicalNode(node)) {
    issues.push({
      code: "unsupported-lexical-node",
      nodeType: node.getType(),
    })
  }

  const nodeType = getExpectedLexicalNodeType(node)

  if (nodeType !== null) {
    validateNodeType(node, nodeType, issues)
  }

  if (!isAllowedLexicalChild(parent, node)) {
    issues.push({
      childType: node.getType(),
      code: "unsupported-lexical-hierarchy",
      parentType: parent.getType(),
    })
  }

  if ($isTextNode(node)) {
    validateTextNode(node, parent, issues)
    return
  }

  if ($isResourceImageNode(node)) {
    validateResourceImageProperties(node, issues)
  }

  if (!$isElementNode(node)) {
    return
  }

  validateElementProperties(node, issues)

  if ($isHeadingNode(node) && !["h1", "h2", "h3"].includes(node.getTag())) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "tag",
      value: node.getTag(),
    })
  }

  if ($isCodeNode(node)) {
    const language = node.getLanguage()
    const theme = node.getTheme()

    if (
      language !== null &&
      language !== undefined &&
      !/^[^\s`]+$/u.test(language)
    ) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property: "language",
        value: language,
      })
    }

    if (node.getIsSyntaxHighlightSupported()) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property: "syntax-highlight",
        value: true,
      })
    }

    if (theme !== undefined) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property: "theme",
        value: theme,
      })
    }
  }

  if ($isLinkNode(node)) {
    validateLinkProperties(node, issues)
  }

  if ($isListItemNode(node)) {
    validateListItemProperties(node, issues)
  }

  if ($isListNode(node)) {
    validateListProperties(node, issues)
  }

  if ($isTableNode(node)) {
    validateTableProperties(node, issues)
    validateTableShape(node, issues)
  }

  if ($isTableRowNode(node)) {
    validateTableRowProperties(node, issues)
  }

  if ($isTableCellNode(node)) {
    validateTableCellProperties(node, issues)

    if (node.getChildrenSize() !== 1) {
      issues.push({
        children: node.getChildrenSize(),
        code: "unsupported-table-cell-cardinality",
      })
    }
  }

  for (const child of node.getChildren()) {
    validateLexicalNode(child, node, issues)
  }
}

function validateNodeType(
  node: LexicalNode,
  expectedNodeType: string,
  issues: ResourceDocumentStructureIssue[]
): void {
  if (node.getType() !== expectedNodeType) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: expectedNodeType,
      property: "type",
      value: node.getType(),
    })
  }
}

function validateResourceImageProperties(
  node: ResourceImageNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const alt: unknown = node.getAltText()
  const url: unknown = node.getUrl()

  if (typeof alt !== "string" || alt.trim().length === 0) {
    issues.push({
      code: "invalid-resource-image-property",
      property: "alt",
    })
  }

  if (typeof url !== "string" || !isAllowedResourceImageUrl(url)) {
    issues.push({
      code: "invalid-resource-image-property",
      property: "url",
    })
  }
}

function validateNodeMetadata(
  node: LexicalNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const slots = $getSlotNames(node)

  if (slots.length > 0) {
    issues.push({
      code: "unsupported-node-slots",
      nodeType: node.getType(),
      slots,
    })
  }

  const state = node.exportJSON()[NODE_STATE_KEY]

  if (state === undefined) {
    return
  }

  const keys = Object.keys(state).sort()
  const hasSupportedTableState =
    $isTableNode(node) &&
    keys.length === 1 &&
    keys[0] === RESOURCE_TABLE_COLUMN_ALIGNMENTS_STATE_KEY &&
    isResourceTableColumnAlignments(
      state[RESOURCE_TABLE_COLUMN_ALIGNMENTS_STATE_KEY]
    )

  if (!hasSupportedTableState) {
    issues.push({
      code: "unsupported-node-state",
      keys,
      nodeType: node.getType(),
    })
  }
}

function validateLinkProperties(
  node: LinkNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const url: unknown = node.getURL()

  if (typeof url !== "string" || !isAllowedResourceLinkUrl(url)) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "url",
      value: typeof url === "string" ? url : typeof url,
    })
  }

  const properties = [
    ["rel", node.getRel()],
    ["target", node.getTarget()],
    ["title", node.getTitle()],
  ] as const

  for (const [property, value] of properties) {
    if (value !== null) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property,
        value,
      })
    }
  }
}

function validateListItemProperties(
  node: ListItemNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const parent = node.getParent()

  if (!$isListNode(parent)) {
    return
  }

  const rawChecked = node.getLatest().__checked

  if (parent.getListType() !== "check" && rawChecked !== undefined) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "checked",
      value: rawChecked,
    })
  }

  const itemIndex = parent.getChildren().filter($isListItemNode).indexOf(node)
  const expectedValue = parent.getStart() + itemIndex

  if (node.getValue() !== expectedValue) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "value",
      value: node.getValue(),
    })
  }

  const expectedIndent = countAncestorLists(node) - 1

  if (node.getIndent() !== expectedIndent) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "indent",
      value: node.getIndent(),
    })
  }

  const children = node.getChildren()
  const firstNestedList = children.findIndex($isListNode)

  if (firstNestedList === 0 || children.length === 0) {
    issues.push({ code: "unsupported-list-item-structure" })
  }
}

function validateListProperties(
  node: ListNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const listType = node.getListType()

  if (!isSupportedListType(listType)) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "list-type",
      value: listType,
    })
  } else {
    const expectedTag = listType === "number" ? "ol" : "ul"

    if (node.getTag() !== expectedTag) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property: "tag",
        value: node.getTag(),
      })
    }
  }

  const start = node.getStart()
  const hasSupportedStart =
    listType === "number"
      ? Number.isInteger(start) && start >= 0 && start <= 999_999_999
      : start === 1

  if (!hasSupportedStart) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "start",
      value: start,
    })
  }

  if (node.getIndent() !== 0) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "indent",
      value: node.getIndent(),
    })
  }
}

function isSupportedListType(
  value: string
): value is "bullet" | "check" | "number" {
  return value === "bullet" || value === "check" || value === "number"
}

function countAncestorLists(node: LexicalNode): number {
  let lists = 0
  let ancestor = node.getParent()

  while (ancestor !== null) {
    if ($isListNode(ancestor)) {
      lists += 1
    }

    ancestor = ancestor.getParent()
  }

  return lists
}

function validateTableProperties(
  node: TableNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const widths = node.getColWidths()

  if (widths !== undefined) {
    issues.push({ code: "unsupported-table-column-widths", widths })
  }

  const properties = [
    ["frozen-columns", node.getFrozenColumns(), 0],
    ["frozen-rows", node.getFrozenRows(), 0],
    ["row-striping", node.getRowStriping(), false],
  ] as const

  for (const [property, value, defaultValue] of properties) {
    if (value !== defaultValue) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property,
        value,
      })
    }
  }
}

function validateTableRowProperties(
  node: TableRowNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const height = node.getHeight()

  if (height !== undefined) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "height",
      value: height,
    })
  }
}

function validateTableCellProperties(
  node: TableCellNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const properties = [
    ["col-span", node.getColSpan(), 1],
    ["row-span", node.getRowSpan(), 1],
    ["width", node.getWidth(), undefined],
    ["background-color", node.getBackgroundColor(), null],
  ] as const

  for (const [property, value, defaultValue] of properties) {
    if (value !== defaultValue && value !== null && value !== undefined) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property,
        value,
      })
    }
  }

  const row = node.getParent()
  const expectedHeaderState =
    $isTableRowNode(row) && row.getIndexWithinParent() === 0
      ? TableCellHeaderStates.ROW
      : TableCellHeaderStates.NO_STATUS

  if (node.getHeaderStyles() !== expectedHeaderState) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "header-state",
      value: node.getHeaderStyles(),
    })
  }

  const verticalAlign = node.getVerticalAlign()

  if (verticalAlign !== undefined) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "vertical-align",
      value: verticalAlign,
    })
  }
}

function validateTextNode(
  node: TextNode,
  parent: ElementNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const format = node.getFormat()
  const unknownFormat = format & ~IS_ALL_FORMATTING

  if (unknownFormat !== 0) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "format",
      value: format,
    })
  }

  if ($isCodeNode(parent) && (format & IS_ALL_FORMATTING) !== 0) {
    issues.push({
      code: "unsupported-lexical-property",
      nodeType: node.getType(),
      property: "format",
      value: format,
    })
  }

  const formats = [...supportedTextFormats, ...unsupportedTextFormats].filter(
    (format) => node.hasFormat(format)
  )

  for (const format of unsupportedTextFormats) {
    if (node.hasFormat(format)) {
      issues.push({ code: "unsupported-text-format", format })
    }
  }

  if (node.hasFormat("code") && formats.length > 1) {
    issues.push({
      code: "unsupported-text-format-combination",
      formats,
    })
  }

  if (node.getStyle() !== "") {
    issues.push({
      code: "unsupported-text-style",
      style: node.getStyle(),
    })
  }

  if (node.getMode() !== "normal") {
    issues.push({
      code: "unsupported-text-mode",
      mode: node.getMode(),
    })
  }

  if (node.getDetail() !== 0) {
    issues.push({
      code: "unsupported-text-detail",
      detail: node.getDetail(),
    })
  }
}

function validateElementProperties(
  node: ElementNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const properties = [
    ["direction", node.getDirection()],
    ["format", node.getFormatType()],
    ["indent", node.getIndent()],
    ["style", node.getStyle()],
    ["text-format", node.getTextFormat()],
    ["text-style", node.getTextStyle()],
  ] as const

  for (const [property, value] of properties) {
    if (property === "indent" && ($isListNode(node) || $isListItemNode(node))) {
      continue
    }

    if (value !== null && value !== "" && value !== 0) {
      issues.push({
        code: "unsupported-lexical-property",
        nodeType: node.getType(),
        property,
        value,
      })
    }
  }
}

function validateTableShape(
  node: TableNode,
  issues: ResourceDocumentStructureIssue[]
): void {
  const rows = node.getChildren().filter($isTableRowNode)
  const columns = rows[0]?.getChildren().filter($isTableCellNode).length ?? 0

  if (rows.length === 0 || columns === 0) {
    issues.push({
      code: "unsupported-table-dimensions",
      columns,
      rows: rows.length,
    })
  }

  for (const [rowIndex, row] of rows.entries()) {
    const actual = row.getChildren().filter($isTableCellNode).length

    if (actual !== columns) {
      issues.push({
        actual,
        code: "unsupported-table-row-width",
        expected: columns,
        row: rowIndex,
      })
    }
  }

  const alignments = $getResourceTableColumnAlignments(node).length

  if (alignments !== columns) {
    issues.push({
      alignments,
      code: "unsupported-table-alignment-count",
      columns,
    })
  }
}

function isSupportedLexicalNode(node: LexicalNode): boolean {
  return (
    $isTextNode(node) ||
    $isLineBreakNode(node) ||
    $isParagraphNode(node) ||
    $isHeadingNode(node) ||
    $isQuoteNode(node) ||
    $isCodeNode(node) ||
    $isLinkNode(node) ||
    $isListNode(node) ||
    $isListItemNode(node) ||
    $isTableNode(node) ||
    $isTableRowNode(node) ||
    $isTableCellNode(node) ||
    $isResourceHorizontalRuleNode(node) ||
    $isResourceImageNode(node)
  )
}

function getExpectedLexicalNodeType(node: LexicalNode): string | null {
  if ($isTextNode(node)) {
    return "text"
  }

  if ($isLineBreakNode(node)) {
    return "linebreak"
  }

  if ($isParagraphNode(node)) {
    return "paragraph"
  }

  if ($isHeadingNode(node)) {
    return "heading"
  }

  if ($isQuoteNode(node)) {
    return "quote"
  }

  if ($isCodeNode(node)) {
    return "code"
  }

  if ($isLinkNode(node)) {
    return "link"
  }

  if ($isListNode(node)) {
    return "list"
  }

  if ($isListItemNode(node)) {
    return "listitem"
  }

  if ($isTableNode(node)) {
    return "table"
  }

  if ($isTableRowNode(node)) {
    return "tablerow"
  }

  if ($isTableCellNode(node)) {
    return "tablecell"
  }

  if ($isResourceHorizontalRuleNode(node)) {
    return "resource-horizontal-rule"
  }

  if ($isResourceImageNode(node)) {
    return "resource-image"
  }

  return null
}

function isAllowedLexicalChild(
  parent: ElementNode,
  child: LexicalNode
): boolean {
  if (parent.getType() === "root") {
    return (
      $isParagraphNode(child) ||
      $isHeadingNode(child) ||
      $isQuoteNode(child) ||
      $isCodeNode(child) ||
      $isListNode(child) ||
      $isTableNode(child) ||
      $isResourceHorizontalRuleNode(child) ||
      $isResourceImageNode(child)
    )
  }

  if ($isTableNode(parent)) {
    return $isTableRowNode(child)
  }

  if ($isTableRowNode(parent)) {
    return $isTableCellNode(child)
  }

  if ($isTableCellNode(parent)) {
    return $isParagraphNode(child)
  }

  if ($isListNode(parent)) {
    return $isListItemNode(child)
  }

  if ($isListItemNode(parent)) {
    if ($isListNode(child)) {
      return true
    }

    const firstNestedList = parent.getChildren().findIndex($isListNode)

    return (
      isPhrasingLexicalNode(child) &&
      (firstNestedList === -1 || child.getIndexWithinParent() < firstNestedList)
    )
  }

  if ($isCodeNode(parent)) {
    return $isTextNode(child) || $isLineBreakNode(child)
  }

  if ($isLinkNode(parent)) {
    return $isTextNode(child) || $isLineBreakNode(child)
  }

  if (
    $isParagraphNode(parent) ||
    $isHeadingNode(parent) ||
    $isQuoteNode(parent)
  ) {
    if (
      $isLineBreakNode(child) &&
      ($isHeadingNode(parent) || $isTableCellNode(parent.getParent()))
    ) {
      return false
    }

    return isPhrasingLexicalNode(child)
  }

  return false
}

function isPhrasingLexicalNode(node: LexicalNode): boolean {
  return $isTextNode(node) || $isLineBreakNode(node) || $isLinkNode(node)
}
