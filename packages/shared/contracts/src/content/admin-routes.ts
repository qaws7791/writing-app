import { z } from "zod"

import { courseIdSchema } from "#contracts/content/ids"
import { adminCourseListStatusFilterSchema } from "#contracts/content/status"

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

const positiveIntegerQuery = (fallback: number, max?: number) => {
  const schema = z.coerce.number().int().positive()
  return (max === undefined ? schema : schema.max(max))
    .optional()
    .default(fallback)
}

export const adminCoursesQuerySchema = z.object({
  category: z.string().optional().default(""),
  page: positiveIntegerQuery(defaultPage),
  pageSize: positiveIntegerQuery(defaultPageSize, maxPageSize),
  query: z.string().optional().default(""),
  status: adminCourseListStatusFilterSchema.optional().default("all"),
})

export const adminCourseParamsSchema = z.object({
  courseId: courseIdSchema,
})

export const adminCourseIfMatchHeadersSchema = z.object({
  "if-match": z.string().optional(),
})
