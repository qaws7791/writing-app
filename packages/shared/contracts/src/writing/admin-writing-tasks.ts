import { z } from "zod"

import {
  nonNegativeIntegerSchema,
  positiveIntegerSchema,
} from "#contracts/shared/integer"
import {
  writingDifficultySchema,
  writingDomainSchema,
  writingTaskIdSchema,
  writingTaskPublicationIdSchema,
} from "#contracts/writing/writing"

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

const positiveIntegerQuery = (fallback: number, max?: number) => {
  const schema = z.coerce.number().int().positive()
  return (max === undefined ? schema : schema.max(max))
    .optional()
    .default(fallback)
}

export const adminWritingTaskStatusFilterSchema = z.enum([
  "all",
  "draft",
  "published",
])

export const adminWritingTaskDraftFieldsSchema = z.strictObject({
  audience: z.string(),
  difficulty: writingDifficultySchema,
  domain: writingDomainSchema,
  goalChars: nonNegativeIntegerSchema,
  minChars: nonNegativeIntegerSchema,
  requiredElements: z.array(z.string()),
  situation: z.string(),
  title: z.string(),
  typeName: z.string(),
})

export const adminWritingTasksQuerySchema = z.object({
  domain: writingDomainSchema.optional(),
  page: positiveIntegerQuery(defaultPage),
  pageSize: positiveIntegerQuery(defaultPageSize, maxPageSize),
  query: z.string().trim().max(100).optional().default(""),
  status: adminWritingTaskStatusFilterSchema.optional().default("all"),
})

export const adminWritingTaskParamsSchema = z.object({
  writingTaskId: writingTaskIdSchema,
})

export const adminWritingTaskIfMatchHeadersSchema = z.object({
  "if-match": z.string().optional(),
})

export const adminWritingTaskListItemSchema = z.strictObject({
  difficulty: writingDifficultySchema,
  domain: writingDomainSchema,
  editVersion: nonNegativeIntegerSchema,
  id: writingTaskIdSchema,
  latestPublicationId: writingTaskPublicationIdSchema.nullable(),
  status: z.enum(["draft", "published"]),
  title: z.string(),
  typeName: z.string(),
  updatedAt: z.iso.datetime(),
})

export const adminWritingTaskListDtoSchema = z.strictObject({
  items: z.array(adminWritingTaskListItemSchema),
  pagination: z.strictObject({
    page: positiveIntegerSchema,
    pageSize: positiveIntegerSchema,
    totalItems: nonNegativeIntegerSchema,
    totalPages: positiveIntegerSchema,
  }),
})

export const adminWritingTaskEditorDocumentSchema =
  adminWritingTaskDraftFieldsSchema.extend({
    editVersion: nonNegativeIntegerSchema,
    id: writingTaskIdSchema,
    latestPublicationId: writingTaskPublicationIdSchema.nullable(),
    status: z.enum(["draft", "published"]),
    updatedAt: z.iso.datetime(),
  })

export const adminWritingTaskWriteDocumentSchema =
  adminWritingTaskDraftFieldsSchema.extend({
    editVersion: nonNegativeIntegerSchema,
  })

export const adminPublishWritingTaskResultSchema = z.strictObject({
  editVersion: nonNegativeIntegerSchema,
  publicationId: writingTaskPublicationIdSchema,
  publishedAt: z.iso.datetime(),
})

export type AdminWritingTaskStatusFilter = z.infer<
  typeof adminWritingTaskStatusFilterSchema
>
export type AdminWritingTaskListDto = z.infer<
  typeof adminWritingTaskListDtoSchema
>
export type AdminWritingTaskEditorDocument = z.infer<
  typeof adminWritingTaskEditorDocumentSchema
>
export type AdminWritingTaskWriteDocument = z.infer<
  typeof adminWritingTaskWriteDocumentSchema
>
export type AdminPublishWritingTaskResult = z.infer<
  typeof adminPublishWritingTaskResultSchema
>
