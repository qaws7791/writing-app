import { z } from "zod"

// --- Allowed mark types ---

export type TiptapMarkType = "bold" | "italic"

export type TiptapMark = {
  type: TiptapMarkType
}

// --- Allowed node types ---

export type TiptapNodeType = "paragraph" | "text"

export type TiptapNode = {
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

const paragraphNodeSchema = z
  .object({
    content: z.array(textNodeSchema).optional(),
    type: z.literal("paragraph"),
  })
  .strict()

// --- Document schema ---

export const writingContentSchema: z.ZodType<WritingContent> = z
  .object({
    content: z.array(paragraphNodeSchema).optional(),
    type: z.literal("doc"),
  })
  .strict()
  .meta({ id: "WritingContent" })
