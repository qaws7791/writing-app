import { z } from "zod"

import { courseIdSchema } from "#contracts/content/ids"
import { adminCourseListStatusFilterSchema } from "#contracts/content/status"
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

export const adminCoursesQuerySchema = z.object({
  category: z.string().optional().default(""),
  cursor: courseIdSchema.optional(),
  direction: z.enum(["next", "previous"]).optional().default("next"),
  pageSize: positiveIntegerQuery(defaultPageSize, maxPageSize),
  query: indexedSubstringQuery.optional().default(""),
  status: adminCourseListStatusFilterSchema.optional().default("all"),
})

export const adminCourseParamsSchema = z.object({
  courseId: courseIdSchema,
})

export const adminCourseIfMatchHeadersSchema = z.object({
  "if-match": z.string().optional(),
})
