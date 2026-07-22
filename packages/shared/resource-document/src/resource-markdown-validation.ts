import type { Image, ImageReference, Root } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"
import { visit } from "unist-util-visit"

import { collectResourceMarkdownDefinitions } from "#resource-document/resource-markdown-definitions"

export type ResourceMarkdownIssue =
  | {
      readonly code: "malformed-table-delimiter"
      readonly line: number
    }
  | {
      readonly code: "missing-image-alt"
    }
  | {
      readonly code: "unresolved-image-reference"
      readonly identifier: string
    }
  | {
      readonly code: "unresolved-link-reference"
      readonly identifier: string
    }
  | {
      readonly code: "unsafe-image-url"
      readonly url: string
    }
  | {
      readonly code: "unsafe-link-url"
      readonly url: string
    }
  | {
      readonly code: "unsupported-blockquote-structure"
    }
  | {
      readonly code: "unsupported-code-meta"
    }
  | {
      readonly code: "unsupported-heading-depth"
      readonly depth: number
    }
  | {
      readonly code: "unsupported-inline-image"
    }
  | {
      readonly code: "unsupported-formatted-inline-code"
    }
  | {
      readonly code: "unsupported-image-title"
    }
  | {
      readonly code: "unsupported-link-title"
    }
  | {
      readonly code: "unsupported-list-item-structure"
    }
  | {
      readonly code: "unsupported-loose-list"
    }
  | {
      readonly code: "unsupported-mixed-task-list"
    }
  | {
      readonly code: "unsupported-ordered-task-list"
    }

export type ResourceMarkdownValidation =
  | {
      readonly status: "valid"
    }
  | {
      readonly issues: readonly ResourceMarkdownIssue[]
      readonly status: "invalid"
    }

type ResourceMarkdownAst = Root & {
  readonly data: {
    readonly resourceMarkdownSource: string
  }
}

export function parseResourceMarkdownAst(
  markdown: string
): ResourceMarkdownAst {
  const root = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })

  return Object.assign(root, {
    data: { resourceMarkdownSource: markdown },
  })
}

export function validateResourceMarkdown(
  markdown: string
): ResourceMarkdownValidation {
  return validateResourceMarkdownAst(parseResourceMarkdownAst(markdown))
}

export function validateResourceMarkdownAst(
  root: Root
): ResourceMarkdownValidation {
  const issues: ResourceMarkdownIssue[] = []
  const definitions = collectResourceMarkdownDefinitions(root)
  const supportedBlockImages = collectSupportedBlockImages(root)

  validateMalformedTableDelimiters(root, issues)

  visit(root, (node, _index, parent) => {
    switch (node.type) {
      case "blockquote":
        if (
          node.children.length !== 1 ||
          node.children[0]?.type !== "paragraph"
        ) {
          issues.push({ code: "unsupported-blockquote-structure" })
        }
        break
      case "code":
        if (node.meta !== null && node.meta !== undefined) {
          issues.push({ code: "unsupported-code-meta" })
        }
        break
      case "heading":
        if (node.depth > 3) {
          issues.push({
            code: "unsupported-heading-depth",
            depth: node.depth,
          })
        }
        break
      case "image":
        validateImage({
          alt: node.alt,
          issues,
          supportedBlockImages,
          title: node.title,
          url: node.url,
          image: node,
        })
        break
      case "imageReference": {
        const definition = definitions.get(node.identifier)

        if (definition === undefined) {
          issues.push({
            code: "unresolved-image-reference",
            identifier: node.identifier,
          })
          break
        }

        validateImage({
          alt: node.alt,
          issues,
          supportedBlockImages,
          title: definition.title,
          url: definition.url,
          image: node,
        })
        break
      }
      case "inlineCode":
        if (
          parent?.type === "strong" ||
          parent?.type === "emphasis" ||
          parent?.type === "delete"
        ) {
          issues.push({ code: "unsupported-formatted-inline-code" })
        }
        break
      case "link":
        validateLink(node.url, node.title, issues)
        break
      case "linkReference": {
        const definition = definitions.get(node.identifier)

        if (definition === undefined) {
          issues.push({
            code: "unresolved-link-reference",
            identifier: node.identifier,
          })
          break
        }

        validateLink(definition.url, definition.title, issues)
        break
      }
      case "list": {
        const checkedStates = node.children.map((item) => item.checked)
        const hasTasks = checkedStates.some((checked) => checked !== null)
        const hasPlainItems = checkedStates.some((checked) => checked === null)

        if (hasTasks && hasPlainItems) {
          issues.push({ code: "unsupported-mixed-task-list" })
        }

        if (node.ordered && hasTasks) {
          issues.push({ code: "unsupported-ordered-task-list" })
        }

        if (node.spread || node.children.some((item) => item.spread)) {
          issues.push({ code: "unsupported-loose-list" })
        }
        break
      }
      case "listItem": {
        const paragraphs = node.children.filter(
          (child) => child.type === "paragraph"
        )
        const unsupportedChildren = node.children.filter(
          (child) => child.type !== "paragraph" && child.type !== "list"
        )

        if (
          paragraphs.length !== 1 ||
          node.children[0]?.type !== "paragraph" ||
          unsupportedChildren.length > 0
        ) {
          issues.push({ code: "unsupported-list-item-structure" })
        }
        break
      }
    }
  })

  return issues.length === 0
    ? { status: "valid" }
    : { issues, status: "invalid" }
}

export function isAllowedResourceImageUrl(url: string): boolean {
  if (/\s/.test(url)) {
    return false
  }

  try {
    const parsedUrl = new URL(url)

    return (
      (parsedUrl.protocol === "https:" ||
        (parsedUrl.protocol === "http:" &&
          (parsedUrl.hostname === "localhost" ||
            parsedUrl.hostname === "127.0.0.1"))) &&
      parsedUrl.hostname.length > 0
    )
  } catch {
    return false
  }
}

export function isAllowedResourceLinkUrl(url: string): boolean {
  if (/\s/.test(url)) {
    return false
  }

  if (
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("#")
  ) {
    return true
  }

  if (url.startsWith("mailto:")) {
    return url.length > "mailto:".length
  }

  try {
    const parsedUrl = new URL(url)

    return (
      url.startsWith("https://") &&
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.length > 0
    )
  } catch {
    return false
  }
}

function validateImage({
  alt,
  image,
  issues,
  supportedBlockImages,
  title,
  url,
}: {
  readonly alt: string | null | undefined
  readonly image: Image | ImageReference
  readonly issues: ResourceMarkdownIssue[]
  readonly supportedBlockImages: ReadonlySet<Image | ImageReference>
  readonly title: string | null | undefined
  readonly url: string
}): void {
  if (!supportedBlockImages.has(image)) {
    issues.push({ code: "unsupported-inline-image" })
  }

  if (alt === null || alt === undefined || alt.trim().length === 0) {
    issues.push({ code: "missing-image-alt" })
  }

  if (!isAllowedResourceImageUrl(url)) {
    issues.push({ code: "unsafe-image-url", url })
  }

  if (title !== null && title !== undefined) {
    issues.push({ code: "unsupported-image-title" })
  }
}

function validateLink(
  url: string,
  title: string | null | undefined,
  issues: ResourceMarkdownIssue[]
): void {
  if (!isAllowedResourceLinkUrl(url)) {
    issues.push({ code: "unsafe-link-url", url })
  }

  if (title !== null && title !== undefined) {
    issues.push({ code: "unsupported-link-title" })
  }
}

function collectSupportedBlockImages(
  root: Root
): ReadonlySet<Image | ImageReference> {
  const images = new Set<Image | ImageReference>()

  for (const child of root.children) {
    if (child.type !== "paragraph" || child.children.length !== 1) {
      continue
    }

    const image = child.children[0]

    if (image?.type === "image" || image?.type === "imageReference") {
      images.add(image)
    }
  }

  return images
}

function validateMalformedTableDelimiters(
  root: Root,
  issues: ResourceMarkdownIssue[]
): void {
  const source = readResourceMarkdownSource(root)

  if (source === null) {
    return
  }

  const candidateLines = new Set<number>()

  for (const child of root.children) {
    if (child.type !== "paragraph" || child.position === undefined) {
      continue
    }

    for (
      let line = child.position.start.line;
      line <= child.position.end.line;
      line += 1
    ) {
      candidateLines.add(line)
    }
  }

  const lines = source.split(/\r?\n/)

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1

    if (
      candidateLines.has(lineNumber) &&
      isTableDelimiterIntent(line) &&
      index > 0 &&
      lines[index - 1]?.includes("|")
    ) {
      issues.push({ code: "malformed-table-delimiter", line: lineNumber })
    }
  }
}

function readResourceMarkdownSource(root: Root): string | null {
  const data = root.data as ResourceMarkdownAst["data"] | undefined

  return data?.resourceMarkdownSource ?? null
}

function isTableDelimiterIntent(line: string): boolean {
  return /^\s*\|?(?:\s*:?-*:?[ \t]*\|)+\s*:?-*:?[ \t]*\|?\s*$/.test(line)
}
