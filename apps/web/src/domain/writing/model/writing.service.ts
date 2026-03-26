import { z } from "zod"
import { jsonCodec } from "@/foundation/lib/zod"
import type {
  WritingContent,
  WritingDetail,
  WritingMark,
  WritingNode,
} from "@/domain/writing/model/writing.types"

const boldMarkSchema = z.object({ type: z.literal("bold") }).strict()
const italicMarkSchema = z.object({ type: z.literal("italic") }).strict()
const writingMarkSchema = z.union([boldMarkSchema, italicMarkSchema])

const textNodeSchema = z
  .object({
    marks: z.array(writingMarkSchema).optional(),
    text: z.string().min(1),
    type: z.literal("text"),
  })
  .strict()

const headingAttrsSchema = z
  .object({ level: z.number().int().min(1).max(6) })
  .strict()

const orderedListAttrsSchema = z
  .object({ start: z.number().int().min(1) })
  .strict()

const writingNodeSchema: z.ZodType<WritingNode> = z.lazy(() =>
  z.union([
    textNodeSchema,
    z
      .object({
        content: z.array(textNodeSchema).optional(),
        type: z.literal("paragraph"),
      })
      .strict(),
    z
      .object({
        attrs: headingAttrsSchema,
        content: z.array(textNodeSchema).optional(),
        type: z.literal("heading"),
      })
      .strict(),
    z
      .object({
        content: z.array(writingNodeSchema).optional(),
        type: z.literal("blockquote"),
      })
      .strict(),
    z
      .object({
        content: z
          .array(
            z
              .object({
                content: z.array(writingNodeSchema).optional(),
                type: z.literal("listItem"),
              })
              .strict()
          )
          .optional(),
        type: z.literal("bulletList"),
      })
      .strict(),
    z
      .object({
        attrs: orderedListAttrsSchema.optional(),
        content: z
          .array(
            z
              .object({
                content: z.array(writingNodeSchema).optional(),
                type: z.literal("listItem"),
              })
              .strict()
          )
          .optional(),
        type: z.literal("orderedList"),
      })
      .strict(),
    z
      .object({
        content: z.array(writingNodeSchema).optional(),
        type: z.literal("listItem"),
      })
      .strict(),
  ])
)

export const writingContentSchema: z.ZodType<WritingContent> = z
  .object({
    content: z.array(writingNodeSchema).optional(),
    type: z.literal("doc"),
  })
  .strict()

const writingSummarySchema = z.object({
  characterCount: z.number().int(),
  id: z.number().int(),
  lastSavedAt: z.string(),
  preview: z.string(),
  sourcePromptId: z.number().int().nullable(),
  title: z.string(),
  wordCount: z.number().int(),
})

const writingDetailSchema = writingSummarySchema.extend({
  content: writingContentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const writingDetailsSchema = z.array(writingDetailSchema)

export const writingContentJsonCodec = jsonCodec(writingContentSchema)

export const writingDetailsJsonCodec = jsonCodec(writingDetailsSchema)

export function parseWritingContent(value: unknown): WritingContent {
  return writingContentSchema.parse(value)
}

export function parseWritingDetails(value: unknown): WritingDetail[] {
  return writingDetailsSchema.parse(value)
}

export function createEmptyWritingContent(): WritingContent {
  return {
    content: [{ type: "paragraph" }],
    type: "doc",
  }
}

function applyMarks(text: string, marks?: WritingMark[]): string {
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

function nodeToHtml(node: WritingNode): string {
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

function collectText(
  node: WritingContent | WritingNode,
  parts: string[]
): void {
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

export function writingContentToPlainText(content: WritingContent): string {
  const parts: string[] = []
  collectText(content, parts)

  return parts
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function writingContentToHtml(content: WritingContent): string {
  return (content.content ?? []).map(nodeToHtml).join("") || "<p><br /></p>"
}

export function getWritingMetrics(content: WritingContent): {
  characterCount: number
  plainText: string
  preview: string
  wordCount: number
} {
  const plainText = writingContentToPlainText(content)

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
