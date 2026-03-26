import { z } from "zod"

// --- Allowed mark types ---

export type TiptapMarkType = "bold" | "italic"

export type TiptapMark = {
  type: TiptapMarkType
}

// --- Allowed node types ---

export type TiptapNodeType =
  | "blockquote"
  | "bulletList"
  | "heading"
  | "listItem"
  | "orderedList"
  | "paragraph"
  | "text"

export type TiptapNode = {
  attrs?: { level?: number; start?: number }
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
  type: TiptapNodeType
}

export type WritingContent = {
  content?: TiptapNode[]
  type: "doc"
}

// --- Mark schemas ---

const boldMarkSchema = z.object({ type: z.literal("bold") }).strict()
const italicMarkSchema = z.object({ type: z.literal("italic") }).strict()

const tiptapMarkSchema: z.ZodType<TiptapMark> = z
  .union([boldMarkSchema, italicMarkSchema])
  .meta({ id: "TiptapMark" })

// --- Inline node schemas ---

const textNodeSchema = z
  .object({
    marks: z.array(tiptapMarkSchema).optional(),
    text: z.string().min(1),
    type: z.literal("text"),
  })
  .strict()

// --- Block node schemas (recursive via z.lazy) ---

const headingAttrsSchema = z
  .object({
    level: z.number().int().min(1).max(6),
  })
  .strict()

const orderedListAttrsSchema = z
  .object({
    start: z.number().int().min(1),
  })
  .strict()

const tiptapNodeSchema: z.ZodType<TiptapNode> = z
  .lazy(() =>
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
          content: z.array(tiptapNodeSchema).optional(),
          type: z.literal("blockquote"),
        })
        .strict(),
      z
        .object({
          content: z
            .array(
              z
                .object({
                  content: z.array(tiptapNodeSchema).optional(),
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
                  content: z.array(tiptapNodeSchema).optional(),
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
          content: z.array(tiptapNodeSchema).optional(),
          type: z.literal("listItem"),
        })
        .strict(),
    ])
  )
  .meta({ id: "TiptapNode" })

// --- Document schema ---

const MAX_DEPTH = 12

function checkDepth(node: TiptapNode, depth: number): boolean {
  if (depth > MAX_DEPTH) return false
  if (!node.content) return true
  return node.content.every((child) => checkDepth(child, depth + 1))
}

export const writingContentSchema: z.ZodType<WritingContent> = z
  .object({
    content: z.array(tiptapNodeSchema).optional(),
    type: z.literal("doc"),
  })
  .strict()
  .refine((doc) => !doc.content || doc.content.every((n) => checkDepth(n, 1)), {
    message: `Document nesting exceeds maximum depth of ${MAX_DEPTH}`,
  })
  .meta({ id: "WritingContent" })
