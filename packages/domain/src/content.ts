import { z } from "zod"

type JsonPrimitive = boolean | null | number | string
export type JsonValue = JsonArray | JsonObject | JsonPrimitive
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }

const jsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    jsonPrimitiveSchema,
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
)

export type TiptapMark = {
  attrs?: JsonObject
  type: string
}

export type TiptapNode = {
  attrs?: JsonObject
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
  type: string
}

export type DraftContent = {
  content?: TiptapNode[]
  type: "doc"
}

const tiptapMarkSchema: z.ZodType<TiptapMark> = z
  .object({
    attrs: z.record(jsonValueSchema).optional(),
    type: z.string().min(1),
  })
  .strict()

const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z
    .object({
      attrs: z.record(jsonValueSchema).optional(),
      content: z.array(tiptapNodeSchema).optional(),
      marks: z.array(tiptapMarkSchema).optional(),
      text: z.string().optional(),
      type: z.string().min(1),
    })
    .strict()
)

export const draftContentSchema: z.ZodType<DraftContent> = z
  .object({
    content: z.array(tiptapNodeSchema).optional(),
    type: z.literal("doc"),
  })
  .strict()

export function createEmptyDraftContent(): DraftContent {
  return {
    content: [{ type: "paragraph" }],
    type: "doc",
  }
}

function collectTextParts(
  node: DraftContent | TiptapNode,
  buffer: string[],
  insideBlock: boolean
): void {
  if ("text" in node && typeof node.text === "string") {
    buffer.push(node.text)
  }

  if (!node.content || node.content.length === 0) {
    return
  }

  node.content.forEach((child, index) => {
    collectTextParts(child, buffer, child.type === "paragraph")

    const isLastChild = index === node.content!.length - 1
    if (!isLastChild && (child.type === "paragraph" || insideBlock)) {
      buffer.push("\n")
    }
  })
}

export function extractDraftTextMetrics(content: DraftContent): {
  characterCount: number
  plainText: string
  wordCount: number
} {
  const buffer: string[] = []
  collectTextParts(content, buffer, false)

  const plainText = buffer
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  const wordCount =
    plainText.length === 0 ? 0 : plainText.split(/\s+/).filter(Boolean).length

  return {
    characterCount: plainText.length,
    plainText,
    wordCount,
  }
}
