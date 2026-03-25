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
    z.record(z.string(), jsonValueSchema),
  ])
)

export type TiptapMark = {
  attrs?: { [key: string]: unknown }
  type: string
}

export type TiptapNode = {
  attrs?: { [key: string]: unknown }
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
    attrs: z.record(z.string(), jsonValueSchema).optional(),
    type: z.string().min(1),
  })
  .strict()
  .meta({ id: "TiptapMark" })

const tiptapNodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z
    .object({
      attrs: z.record(z.string(), jsonValueSchema).optional(),
      content: z.array(tiptapNodeSchema).optional(),
      marks: z.array(tiptapMarkSchema).optional(),
      text: z.string().optional(),
      type: z.string().min(1),
    })
    .strict()
    .meta({ id: "TiptapNode" })
)

export const draftContentSchema: z.ZodType<DraftContent> = z
  .object({
    content: z.array(tiptapNodeSchema).optional(),
    type: z.literal("doc"),
  })
  .strict()
  .meta({ id: "DraftContent" })
