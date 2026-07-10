import { z } from "zod"
import {
  adminContentStatusSchema,
  adminNonNegativeIntegerSchema,
  adminPositiveIntegerSchema,
} from "@workspace/contracts/admin/admin-shared"

export const adminResourceDocumentMaxTextLength = 200_000
const adminResourceParagraphMaxCount = 500
const adminResourceTextNodeMaxCount = 100
const adminResourceTextNodeMaxLength = 10_000

export const adminResourceDocumentStatusFilterSchema = z.union([
  z.literal("all"),
  adminContentStatusSchema,
])

export const adminTiptapTextNodeSchema = z.object({
  text: z.string().max(adminResourceTextNodeMaxLength),
  type: z.literal("text"),
})

export const adminTiptapParagraphNodeSchema = z.object({
  content: z
    .array(adminTiptapTextNodeSchema)
    .max(adminResourceTextNodeMaxCount)
    .optional(),
  type: z.literal("paragraph"),
})

export const adminTiptapDocumentSchema = z
  .object({
    content: z
      .array(adminTiptapParagraphNodeSchema)
      .min(1)
      .max(adminResourceParagraphMaxCount),
    type: z.literal("doc"),
  })
  .refine(
    (document) =>
      document.content.reduce(
        (documentLength, paragraph) =>
          documentLength +
          (paragraph.content?.reduce(
            (paragraphLength, textNode) =>
              paragraphLength + textNode.text.length,
            0
          ) ?? 0),
        0
      ) <= adminResourceDocumentMaxTextLength,
    {
      message: "자료실 문서 본문이 허용된 크기를 초과했습니다.",
    }
  )

export const adminResourceDocumentAuthorDtoSchema = z.object({
  email: z.string(),
  id: z.string(),
  name: z.string(),
})

export const adminResourceDocumentListItemDtoSchema = z.object({
  author: adminResourceDocumentAuthorDtoSchema,
  createdAt: z.string(),
  excerpt: z.string(),
  id: z.string(),
  status: adminContentStatusSchema,
  title: z.string(),
  updatedAt: z.string(),
})

export const adminResourceDocumentDetailDtoSchema =
  adminResourceDocumentListItemDtoSchema.extend({
    content: adminTiptapDocumentSchema,
  })

export const adminResourceDocumentListDtoSchema = z.object({
  items: z.array(adminResourceDocumentListItemDtoSchema),
  pagination: z.object({
    page: adminPositiveIntegerSchema,
    pageSize: adminPositiveIntegerSchema,
    totalItems: adminNonNegativeIntegerSchema,
    totalPages: adminPositiveIntegerSchema,
  }),
})

export const adminResourceDocumentRequestSchema = z.object({
  content: adminTiptapDocumentSchema,
  title: z.string().trim().min(1).max(120),
})

export const adminArchiveResourceDocumentResultSchema = z.object({
  archived: z.literal(true),
})

export const adminDeleteResourceDocumentResultSchema = z.object({
  deleted: z.literal(true),
})

export type AdminArchiveResourceDocumentResultDto = z.infer<
  typeof adminArchiveResourceDocumentResultSchema
>
export type AdminDeleteResourceDocumentResultDto = z.infer<
  typeof adminDeleteResourceDocumentResultSchema
>
export type AdminResourceDocumentDetailDto = z.infer<
  typeof adminResourceDocumentDetailDtoSchema
>
export type AdminResourceDocumentListDto = z.infer<
  typeof adminResourceDocumentListDtoSchema
>
export type AdminResourceDocumentRequest = z.infer<
  typeof adminResourceDocumentRequestSchema
>
export type AdminResourceDocumentStatusFilter = z.infer<
  typeof adminResourceDocumentStatusFilterSchema
>
export type AdminTiptapDocument = z.infer<typeof adminTiptapDocumentSchema>
