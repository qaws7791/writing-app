import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code"
import { $createLinkNode, $isLinkNode, LinkNode } from "@lexical/link"
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from "@lexical/list"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text"
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import type {
  BlockContent,
  Definition,
  List as MarkdownList,
  ListItem as MarkdownListItem,
  Nodes,
  Parents,
  PhrasingContent,
  Root,
  RootContent,
  Table,
  TableCell,
} from "mdast"
import { gfmToMarkdown } from "mdast-util-gfm"
import { toMarkdown } from "mdast-util-to-markdown"
import type { Handle, Info, State } from "mdast-util-to-markdown"
import type {
  ElementNode,
  LexicalNode,
  TextFormatType,
  TextNode,
} from "lexical"
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
} from "lexical"

import {
  $createResourceHorizontalRuleNode,
  $isResourceHorizontalRuleNode,
  ResourceHorizontalRuleNode,
} from "#resource-document/resource-horizontal-rule-node"
import {
  $createResourceImageNode,
  $isResourceImageNode,
  ResourceImageNode,
} from "#resource-document/resource-image-node"
import { collectResourceMarkdownDefinitions } from "#resource-document/resource-markdown-definitions"
import {
  $getResourceTableColumnAlignments,
  $setResourceTableColumnAlignments,
} from "#resource-document/resource-table-state"

declare module "mdast-util-to-markdown" {
  interface ConstructNameMap {
    strikethrough: "strikethrough"
  }
}

export const resourceDocumentAstNodes = [
  CodeNode,
  HeadingNode,
  LinkNode,
  ListItemNode,
  ListNode,
  QuoteNode,
  ResourceHorizontalRuleNode,
  ResourceImageNode,
  TableCellNode,
  TableNode,
  TableRowNode,
] as const

export function $importResourceMarkdownAst(root: Root): void {
  const lexicalRoot = $getRoot()
  const definitions = collectResourceMarkdownDefinitions(root)

  lexicalRoot.clear()

  for (const node of root.children) {
    const lexicalNode = createBlockNode(node, definitions)

    if (lexicalNode !== null) {
      lexicalRoot.append(lexicalNode)
    }
  }

  if (lexicalRoot.getChildrenSize() === 0) {
    lexicalRoot.append($createParagraphNode())
  }
}

export function $exportResourceMarkdownAst(): Root {
  return {
    children: $getRoot()
      .getChildren()
      .map(exportBlockNode)
      .filter(
        (node): node is RootContent =>
          node !== null &&
          !(node.type === "paragraph" && node.children.length === 0)
      ),
    type: "root",
  }
}

export function serializeResourceMarkdownAst(root: Root): string {
  return toMarkdown(root, {
    bullet: "-",
    emphasis: "_",
    extensions: [
      gfmToMarkdown(),
      { handlers: { delete: resourceDeleteHandler } },
    ],
    fences: true,
    listItemIndent: "one",
    rule: "-",
    ruleRepetition: 3,
  }).trimEnd()
}

type ResourceMarkdownHandle = Handle & { peek?: Handle }

const resourceDeleteHandler: ResourceMarkdownHandle = (
  node: Nodes,
  _parent: Parents | undefined,
  state: State,
  info: Info
): string => {
  if (node.type !== "delete") {
    throw new TypeError("delete handler에는 delete node가 필요합니다.")
  }

  const tracker = state.createTracker(info)
  const exit = state.enter("strikethrough")
  let value = tracker.move("~~")

  value += state.containerPhrasing(node, {
    ...tracker.current(),
    after: "~",
    before: value,
  })
  value += tracker.move("~~")
  exit()

  const text = node.children.map(readResourcePhrasingText).join("")

  state.attentionEncodeSurroundingInfo = {
    after:
      isResourceWordCharacter(text.at(-1)) &&
      isResourceWordCharacter(info.after.at(0)),
    before:
      isResourceWordCharacter(info.before.at(-1)) &&
      isResourceWordCharacter(text.at(0)),
  }

  return value
}

resourceDeleteHandler.peek = () => "~"

function readResourcePhrasingText(node: PhrasingContent): string {
  switch (node.type) {
    case "break":
      return "\n"
    case "delete":
    case "emphasis":
    case "link":
    case "linkReference":
    case "strong":
      return node.children.map(readResourcePhrasingText).join("")
    case "html":
    case "inlineCode":
    case "text":
      return node.value
    case "image":
    case "imageReference":
      return node.alt ?? ""
    default:
      return ""
  }
}

function isResourceWordCharacter(character: string | undefined): boolean {
  return character !== undefined && /[\p{L}\p{N}]/u.test(character)
}

function createBlockNode(
  node: RootContent,
  definitions: ReadonlyMap<string, Definition>
): LexicalNode | null {
  switch (node.type) {
    case "blockquote": {
      const quoteNode = $createQuoteNode()
      const phrasing = node.children.flatMap((child, index) => {
        const children = readBlockPhrasing(child, definitions)

        return index === 0 ? children : [$createLineBreakNode(), ...children]
      })

      quoteNode.append(...phrasing)
      return quoteNode
    }
    case "code": {
      const codeNode = $createCodeNode(node.lang ?? undefined)

      codeNode.append($createTextNode(node.value))
      return codeNode
    }
    case "heading": {
      if (node.depth > 3) {
        return null
      }

      const headingNode = $createHeadingNode(`h${node.depth}`)

      headingNode.append(...createPhrasingNodes(node.children, definitions))
      return headingNode
    }
    case "html": {
      const codeNode = $createCodeNode("html")

      codeNode.append($createTextNode(node.value))
      return codeNode
    }
    case "image":
      return $createResourceImageNode({ alt: node.alt ?? "", url: node.url })
    case "imageReference": {
      const definition = definitions.get(node.identifier)

      return definition === undefined
        ? null
        : $createResourceImageNode({
            alt: node.alt ?? "",
            url: definition.url,
          })
    }
    case "list":
      return createListNode(node, definitions)
    case "paragraph": {
      if (node.children.length === 1) {
        const child = node.children[0]

        if (child?.type === "image" || child?.type === "imageReference") {
          return createBlockNode(child, definitions)
        }
      }

      return $createParagraphNode().append(
        ...createPhrasingNodes(node.children, definitions)
      )
    }
    case "table":
      return createTableNode(node, definitions)
    case "thematicBreak":
      return $createResourceHorizontalRuleNode()
    case "definition":
      return null
    default:
      return null
  }
}

function createPhrasingNodes(
  nodes: readonly PhrasingContent[],
  definitions: ReadonlyMap<string, Definition>,
  formats: readonly TextFormatType[] = []
): LexicalNode[] {
  return nodes.flatMap((node) => {
    switch (node.type) {
      case "break":
        return [$createLineBreakNode()]
      case "delete":
        return createPhrasingNodes(node.children, definitions, [
          ...formats,
          "strikethrough",
        ])
      case "emphasis":
        return createPhrasingNodes(node.children, definitions, [
          ...formats,
          "italic",
        ])
      case "html":
        return [createFormattedTextNode(node.value, ["code"])]
      case "image":
      case "imageReference":
        return []
      case "inlineCode":
        return [createFormattedTextNode(node.value, ["code"])]
      case "link": {
        const linkNode = $createLinkNode(node.url)

        linkNode.append(
          ...createPhrasingNodes(node.children, definitions, formats)
        )
        return [linkNode]
      }
      case "linkReference": {
        const definition = definitions.get(node.identifier)

        if (definition === undefined) {
          return []
        }

        const linkNode = $createLinkNode(definition.url)

        linkNode.append(
          ...createPhrasingNodes(node.children, definitions, formats)
        )
        return [linkNode]
      }
      case "strong":
        return createPhrasingNodes(node.children, definitions, [
          ...formats,
          "bold",
        ])
      case "text":
        return [createFormattedTextNode(node.value, formats)]
      default:
        return []
    }
  })
}

function createFormattedTextNode(
  value: string,
  formats: readonly TextFormatType[]
): TextNode {
  const textNode = $createTextNode(value)

  for (const format of formats) {
    textNode.toggleFormat(format)
  }

  return textNode
}

function createListNode(
  node: MarkdownList,
  definitions: ReadonlyMap<string, Definition>
): ListNode {
  const isCheckList = node.children.every((item) => item.checked !== null)
  const listNode = $createListNode(
    isCheckList ? "check" : node.ordered ? "number" : "bullet",
    node.start ?? undefined
  )

  for (const item of node.children) {
    listNode.append(createListItemNode(item, definitions, isCheckList))
  }

  return listNode
}

function createListItemNode(
  item: MarkdownListItem,
  definitions: ReadonlyMap<string, Definition>,
  isCheckList: boolean
): ListItemNode {
  const itemNode = $createListItemNode(
    isCheckList ? item.checked === true : undefined
  )

  for (const child of item.children) {
    if (child.type === "list") {
      itemNode.append(createListNode(child, definitions))
      continue
    }

    const phrasing = readBlockPhrasing(child, definitions)

    if (itemNode.getChildrenSize() > 0 && phrasing.length > 0) {
      itemNode.append($createLineBreakNode())
    }

    itemNode.append(...phrasing)
  }

  return itemNode
}

function readBlockPhrasing(
  node: RootContent,
  definitions: ReadonlyMap<string, Definition>
): LexicalNode[] {
  switch (node.type) {
    case "heading":
    case "paragraph":
      return createPhrasingNodes(node.children, definitions)
    case "html":
      return [$createTextNode(node.value)]
    default:
      return [
        $createTextNode(
          serializeResourceMarkdownAst({ children: [node], type: "root" })
        ),
      ]
  }
}

function createTableNode(
  node: Table,
  definitions: ReadonlyMap<string, Definition>
): TableNode {
  const tableNode = $createTableNode()
  const columnCount = node.children[0]?.children.length ?? 0

  $setResourceTableColumnAlignments(
    tableNode,
    Array.from(
      { length: columnCount },
      (_, index) => node.align?.[index] ?? null
    )
  )

  for (const [rowIndex, row] of node.children.entries()) {
    const rowNode = $createTableRowNode()

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cell = row.children[columnIndex]
      const headerState =
        rowIndex === 0
          ? TableCellHeaderStates.ROW
          : TableCellHeaderStates.NO_STATUS
      const cellNode = $createTableCellNode(headerState)
      const paragraph = $createParagraphNode()

      if (cell !== undefined) {
        paragraph.append(...createPhrasingNodes(cell.children, definitions))
      }
      cellNode.append(paragraph)
      rowNode.append(cellNode)
    }

    tableNode.append(rowNode)
  }

  return tableNode
}

function exportBlockNode(node: LexicalNode): RootContent | null {
  if ($isParagraphNode(node)) {
    return { children: exportPhrasingNodes(node), type: "paragraph" }
  }

  if ($isHeadingNode(node)) {
    return {
      children: exportPhrasingNodes(node),
      depth: Number(node.getTag().slice(1)) as 1 | 2 | 3,
      type: "heading",
    }
  }

  if ($isQuoteNode(node)) {
    return {
      children: [{ children: exportPhrasingNodes(node), type: "paragraph" }],
      type: "blockquote",
    }
  }

  if ($isCodeNode(node)) {
    return {
      lang: node.getLanguage() ?? null,
      type: "code",
      value: node.getTextContent(),
    }
  }

  if ($isListNode(node)) {
    return exportListNode(node)
  }

  if ($isResourceHorizontalRuleNode(node)) {
    return { type: "thematicBreak" }
  }

  if ($isResourceImageNode(node)) {
    return {
      children: [
        {
          alt: node.getAltText(),
          title: null,
          type: "image",
          url: node.getUrl(),
        },
      ],
      type: "paragraph",
    }
  }

  if ($isTableNode(node)) {
    return exportTableNode(node)
  }

  return null
}

function exportPhrasingNodes(parent: ElementNode): PhrasingContent[] {
  return exportPhrasingChildren(parent.getChildren())
}

type ResourceInlineFormat = "bold" | "italic" | "strikethrough"

type ResourcePhrasingEntry = {
  readonly content: PhrasingContent
  readonly formats: ReadonlySet<ResourceInlineFormat>
}

type ResourceFormatNode = Extract<
  PhrasingContent,
  { type: "delete" | "emphasis" | "strong" }
>

function exportPhrasingChildren(
  children: readonly LexicalNode[]
): PhrasingContent[] {
  const entries = children.flatMap(exportPhrasingEntry)
  const output: PhrasingContent[] = []
  const stack: Array<{
    readonly format: ResourceInlineFormat
    readonly node: ResourceFormatNode
  }> = []

  for (const [index, entry] of entries.entries()) {
    let commonDepth = 0

    while (commonDepth < stack.length) {
      const activeFormat = stack[commonDepth]

      if (
        activeFormat === undefined ||
        !entry.formats.has(activeFormat.format)
      ) {
        break
      }

      commonDepth += 1
    }

    stack.length = commonDepth
    let destination = output

    if (commonDepth > 0) {
      const parentFormat = stack[commonDepth - 1]

      if (parentFormat === undefined) {
        throw new Error("inline format stack이 유효하지 않습니다.")
      }

      destination = parentFormat.node.children
    }

    const activeFormats = new Set(stack.map(({ format }) => format))
    const formatsToOpen = [...entry.formats]
      .filter((format) => !activeFormats.has(format))
      .sort((left, right) => {
        const runDifference =
          findFormatRunEnd(entries, index, right) -
          findFormatRunEnd(entries, index, left)

        return runDifference === 0
          ? resourceInlineFormatOrder.indexOf(left) -
              resourceInlineFormatOrder.indexOf(right)
          : runDifference
      })

    for (const format of formatsToOpen) {
      const formatNode = createResourceFormatNode(format)

      destination.push(formatNode)
      stack.push({ format, node: formatNode })
      destination = formatNode.children
    }

    destination.push(entry.content)
  }

  return output
}

const resourceInlineFormatOrder: readonly ResourceInlineFormat[] = [
  "bold",
  "italic",
  "strikethrough",
]

function exportPhrasingEntry(node: LexicalNode): ResourcePhrasingEntry[] {
  if ($isTextNode(node)) {
    return [
      {
        content: node.hasFormat("code")
          ? { type: "inlineCode", value: node.getTextContent() }
          : { type: "text", value: node.getTextContent() },
        formats: new Set(
          node.hasFormat("code")
            ? []
            : resourceInlineFormatOrder.filter((format) =>
                node.hasFormat(format)
              )
        ),
      },
    ]
  }

  if ($isLineBreakNode(node)) {
    return [{ content: { type: "break" }, formats: new Set() }]
  }

  if ($isLinkNode(node)) {
    return [
      {
        content: {
          children: exportPhrasingNodes(node),
          title: node.getTitle(),
          type: "link",
          url: node.getURL(),
        },
        formats: new Set(),
      },
    ]
  }

  return []
}

function findFormatRunEnd(
  entries: readonly ResourcePhrasingEntry[],
  start: number,
  format: ResourceInlineFormat
): number {
  let end = start

  while (end + 1 < entries.length) {
    const nextEntry = entries[end + 1]

    if (nextEntry === undefined || !nextEntry.formats.has(format)) {
      break
    }

    end += 1
  }

  return end
}

function createResourceFormatNode(
  format: ResourceInlineFormat
): ResourceFormatNode {
  switch (format) {
    case "bold":
      return { children: [], type: "strong" }
    case "italic":
      return { children: [], type: "emphasis" }
    case "strikethrough":
      return { children: [], type: "delete" }
  }
}

function exportListNode(node: ListNode): MarkdownList {
  return {
    children: node
      .getChildren()
      .filter($isListItemNode)
      .map(exportListItemNode),
    ordered: node.getListType() === "number",
    spread: false,
    start: node.getListType() === "number" ? node.getStart() : null,
    type: "list",
  }
}

function exportListItemNode(node: ListItemNode): MarkdownListItem {
  const blocks: BlockContent[] = []
  const phrasingNodes: LexicalNode[] = []
  const parent = node.getParent()

  for (const child of node.getChildren()) {
    if ($isListNode(child)) {
      if (phrasingNodes.length > 0) {
        blocks.push({
          children: exportPhrasingChildren(phrasingNodes),
          type: "paragraph",
        })
        phrasingNodes.length = 0
      }

      blocks.push(exportListNode(child))
      continue
    }

    phrasingNodes.push(child)
  }

  if (phrasingNodes.length > 0 || blocks.length === 0) {
    blocks.unshift({
      children: exportPhrasingChildren(phrasingNodes),
      type: "paragraph",
    })
  }

  return {
    checked:
      $isListNode(parent) && parent.getListType() === "check"
        ? node.getChecked()
        : null,
    children: blocks,
    spread: false,
    type: "listItem",
  }
}

function exportTableNode(node: TableNode): Table {
  return {
    align: [...$getResourceTableColumnAlignments(node)],
    children: node
      .getChildren()
      .filter($isTableRowNode)
      .map((row) => {
        return {
          children: row
            .getChildren()
            .filter($isTableCellNode)
            .map((cell) => {
              const paragraph = cell.getFirstChild()

              return {
                children: $isParagraphNode(paragraph)
                  ? exportPhrasingNodes(paragraph)
                  : [],
                type: "tableCell",
              } satisfies TableCell
            }),
          type: "tableRow",
        }
      }),
    type: "table",
  }
}
