import { createHeadlessEditor } from "@lexical/headless"
import {
  BOLD_ITALIC_STAR,
  BOLD_STAR,
  CHECK_LIST,
  CODE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  type ElementTransformer,
  type TextMatchTransformer,
  type Transformer,
} from "@lexical/markdown"
import type { Klass, LexicalEditor, LexicalNode } from "lexical"
import type { Heading, Root } from "mdast"
import { visit } from "unist-util-visit"

import {
  $exportResourceMarkdownAst,
  $importResourceMarkdownAst,
  resourceDocumentAstNodes,
  serializeResourceMarkdownAst,
} from "#resource-document/resource-markdown-ast"
import {
  $validateResourceDocumentStructure,
  type ResourceDocumentStructureIssue,
} from "#resource-document/resource-lexical-validation"
import {
  isAllowedResourceLinkUrl,
  parseResourceMarkdownAst,
  validateResourceMarkdownAst,
  type ResourceMarkdownIssue,
  type ResourceMarkdownValidation,
} from "#resource-document/resource-markdown-validation"
import {
  $createResourceHorizontalRuleNode,
  $isResourceHorizontalRuleNode,
  ResourceHorizontalRuleNode,
} from "#resource-document/resource-horizontal-rule-node"

export type ValidResourceMarkdown = {
  readonly markdown: string
  readonly status: "valid"
}

export type InvalidResourceMarkdown = {
  readonly issues: readonly ResourceDocumentIssue[]
  readonly status: "invalid"
}

export type ResourceMarkdownNormalization =
  | InvalidResourceMarkdown
  | ValidResourceMarkdown

export type ResourceMarkdownImportPreparation =
  | InvalidResourceMarkdown
  | {
      readonly headingTitle: string | null
      readonly markdown: string
      readonly status: "valid"
    }

export type ResourceMarkdownPlainText =
  | {
      readonly issues: readonly ResourceMarkdownIssue[]
      readonly status: "invalid"
    }
  | {
      readonly status: "valid"
      readonly text: string
    }

export type ResourceDocumentIssue =
  | ResourceDocumentStructureIssue
  | ResourceMarkdownIssue
  | {
      readonly code: "markdown-round-trip-mismatch"
    }

const resourceHeadingTransformer: ElementTransformer = {
  ...HEADING,
  regExp: /^(#{1,3})\s/,
}

const resourceHorizontalRuleTransformer: ElementTransformer = {
  dependencies: [ResourceHorizontalRuleNode],
  export: (node) => ($isResourceHorizontalRuleNode(node) ? "---" : null),
  regExp: /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/,
  replace: (parentNode) => {
    parentNode.replace($createResourceHorizontalRuleNode())
  },
  type: "element",
}

const resourceLinkTransformer: TextMatchTransformer = {
  ...LINK,
  replace: (textNode, match) => {
    const url = match[2]

    if (url === undefined || !isAllowedResourceLinkUrl(url)) {
      return
    }

    return LINK.replace?.(textNode, match)
  },
}

export const resourceDocumentNodes: readonly Klass<LexicalNode>[] = [
  ...resourceDocumentAstNodes,
]

export const resourceMarkdownTransformers: readonly Transformer[] = [
  resourceHeadingTransformer,
  resourceHorizontalRuleTransformer,
  QUOTE,
  CHECK_LIST,
  UNORDERED_LIST,
  ORDERED_LIST,
  CODE,
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_STAR,
  ITALIC_STAR,
  STRIKETHROUGH,
  resourceLinkTransformer,
]

export function createResourceDocumentEditor(): LexicalEditor {
  return createHeadlessEditor({
    namespace: "resource-document",
    nodes: [...resourceDocumentNodes],
    onError: (error) => {
      throw error
    },
  })
}

export function replaceResourceDocumentMarkdown(
  editor: LexicalEditor,
  markdown: string
): ResourceMarkdownValidation {
  const root = parseResourceMarkdownAst(markdown)
  const validation = validateResourceMarkdownAst(root)

  if (validation.status === "invalid") {
    return validation
  }

  editor.update(() => $importResourceMarkdownAst(root), { discrete: true })

  return validation
}

export function readResourceDocumentMarkdown(
  editor: LexicalEditor
): ResourceMarkdownNormalization {
  const result = editor.read(() => {
    const validation = $validateResourceDocumentStructure()

    return validation.status === "invalid"
      ? validation
      : { root: $exportResourceMarkdownAst(), status: "valid" as const }
  })

  if (result.status === "invalid") {
    return result
  }

  const editorState = editor.getEditorState()

  const markdown = serializeResourceMarkdownAst(result.root)
  const parsedMarkdown = parseResourceMarkdownAst(markdown)
  const markdownValidation = validateResourceMarkdownAst(parsedMarkdown)

  if (markdownValidation.status === "invalid") {
    return markdownValidation
  }

  const restoredEditor = createResourceDocumentEditor()

  restoredEditor.update(() => $importResourceMarkdownAst(parsedMarkdown), {
    discrete: true,
  })

  if (
    JSON.stringify(editorState.toJSON()) !==
    JSON.stringify(restoredEditor.getEditorState().toJSON())
  ) {
    return {
      issues: [{ code: "markdown-round-trip-mismatch" }],
      status: "invalid",
    }
  }

  return {
    markdown,
    status: "valid",
  }
}

export function normalizeResourceMarkdown(
  markdown: string
): ResourceMarkdownNormalization {
  const editor = createResourceDocumentEditor()
  const validation = replaceResourceDocumentMarkdown(editor, markdown)

  if (validation.status === "invalid") {
    return validation
  }

  return readResourceDocumentMarkdown(editor)
}

export function prepareResourceMarkdownImport(
  markdown: string
): ResourceMarkdownImportPreparation {
  const normalized = normalizeResourceMarkdown(markdown)

  if (normalized.status === "invalid") {
    return normalized
  }

  const root = parseResourceMarkdownAst(normalized.markdown)
  const firstHeadingIndex = root.children.findIndex(
    (node) => node.type === "heading" && node.depth === 1
  )

  if (firstHeadingIndex < 0) {
    return {
      headingTitle: null,
      markdown: normalized.markdown,
      status: "valid",
    }
  }

  const heading = root.children[firstHeadingIndex]

  if (heading?.type !== "heading") {
    throw new Error("가져올 자료의 첫 번째 H1을 찾지 못했습니다.")
  }

  const body: Root = {
    ...root,
    children: root.children.filter((_, index) => index !== firstHeadingIndex),
  }

  return {
    headingTitle: readAstText(heading),
    markdown: serializeResourceMarkdownAst(body),
    status: "valid",
  }
}

export function readResourceMarkdownPlainText(
  markdown: string
): ResourceMarkdownPlainText {
  const root = parseResourceMarkdownAst(markdown)
  const validation = validateResourceMarkdownAst(root)

  if (validation.status === "invalid") {
    return validation
  }

  return {
    status: "valid",
    text: readAstText(root),
  }
}

function readAstText(root: Heading | Root): string {
  const fragments: string[] = []

  visit(root, (node) => {
    switch (node.type) {
      case "code":
      case "inlineCode":
      case "text":
        fragments.push(node.value)
        break
      case "image":
        fragments.push(node.alt ?? "")
        break
    }
  })

  return fragments.join(" ").replace(/\s+/g, " ").trim()
}
