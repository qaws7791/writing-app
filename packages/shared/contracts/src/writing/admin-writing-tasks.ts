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
import { createIndexedSubstringQuerySchema } from "#contracts/shared/indexed-substring-query"

const defaultPageSize = 20
const maxPageSize = 100

const indexedSubstringQuery = createIndexedSubstringQuerySchema(100)

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
  cursor: writingTaskIdSchema.optional(),
  direction: z.enum(["next", "previous"]).optional().default("next"),
  domain: writingDomainSchema.optional(),
  pageSize: positiveIntegerQuery(defaultPageSize, maxPageSize),
  query: indexedSubstringQuery.optional().default(""),
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
    nextCursor: writingTaskIdSchema.nullable(),
    pageSize: positiveIntegerSchema,
    previousCursor: writingTaskIdSchema.nullable(),
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
