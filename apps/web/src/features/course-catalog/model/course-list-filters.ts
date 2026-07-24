import { z } from "zod"

const optionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : undefined),
  z.string().default("")
)

const courseListSearchParamsSchema = z.object({
  category: optionalStringSchema,
  query: optionalStringSchema,
})

export type CourseListFilters = z.infer<typeof courseListSearchParamsSchema>

export function parseCourseListFilters(
  searchParams: Readonly<Record<string, string | readonly string[] | undefined>>
): CourseListFilters {
  return courseListSearchParamsSchema.parse(searchParams)
}
