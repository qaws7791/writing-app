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
