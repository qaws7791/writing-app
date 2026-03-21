import { draftContentSchema, promptTopics } from "@workspace/backend-core"
import { z } from "zod"

export const promptIdSchema = z.coerce.number().int().positive()
export const draftIdSchema = z.coerce.number().int().positive()
export const promptLevelSchema = z.preprocess(
  (value) => (value === undefined ? undefined : Number(value)),
  z.union([z.literal(1), z.literal(2), z.literal(3)])
)

export const promptFiltersSchema = z.object({
  level: promptLevelSchema.optional(),
  query: z.string().trim().min(1).optional(),
  saved: z
    .enum(["false", "true"])
    .transform((value) => value === "true")
    .optional(),
  topic: z.enum(promptTopics).optional(),
})

export const createDraftSchema = z
  .object({
    content: draftContentSchema.optional(),
    sourcePromptId: promptIdSchema.optional(),
    title: z.string().max(200).optional(),
  })
  .strict()

export const autosaveDraftSchema = z
  .object({
    content: draftContentSchema.optional(),
    title: z.string().max(200).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "변경할 제목 또는 본문이 필요합니다.",
  })
