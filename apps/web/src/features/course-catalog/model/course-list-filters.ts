import { z } from "zod"

const courseSortSchema = z.enum([
  "lesson-count-asc",
  "lesson-count-desc",
  "recommended",
  "title-asc",
  "title-desc",
])

const optionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : undefined),
  z.string().default("")
)

const courseListSearchParamsSchema = z.object({
  category: optionalStringSchema,
  query: optionalStringSchema,
  sort: z.preprocess(
    (value) => (typeof value === "string" ? value : undefined),
    courseSortSchema.catch("recommended")
  ),
})

export type CourseListFilters = z.infer<typeof courseListSearchParamsSchema>

export function parseCourseListFilters(
  searchParams: Readonly<Record<string, string | readonly string[] | undefined>>
): CourseListFilters {
  return courseListSearchParamsSchema.parse(searchParams)
}
