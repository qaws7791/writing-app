import { z } from "zod"
import {
  adminContentStatusSchema,
  adminNonNegativeIntegerSchema,
  adminPositiveIntegerSchema,
} from "@workspace/contracts/admin/admin-shared"

export const adminResourceDocumentStatusFilterSchema = z.union([
  z.literal("all"),
  adminContentStatusSchema,
])

export const adminTiptapTextNodeSchema = z.object({
  text: z.string(),
  type: z.literal("text"),
})

export const adminTiptapParagraphNodeSchema = z.object({
  content: z.array(adminTiptapTextNodeSchema).optional(),
  type: z.literal("paragraph"),
})

export const adminTiptapDocumentSchema = z.object({
  content: z.array(adminTiptapParagraphNodeSchema).min(1),
  type: z.literal("doc"),
})

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
