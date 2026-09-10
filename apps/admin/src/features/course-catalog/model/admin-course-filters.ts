import { contentStatusSchema } from "@workspace/contracts/content/status"
import { z } from "zod"

import type { ReadAdminCoursesInput } from "@/features/course-catalog/model/admin-course-catalog"

const courseFiltersSchema = z.object({
  category: z.preprocess(
    (value) => (typeof value === "string" && value.length > 0 ? value : "all"),
    z.string()
  ),
  cursor: stringValue("").transform((value) => value || undefined),
  direction: z.enum(["next", "previous"]).catch("next"),
  pageSize: positiveInteger(20),
  query: stringValue(""),
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value : "all"),
      z.union([z.literal("all"), contentStatusSchema])
    )
    .catch("all"),
})

export function parseAdminCourseFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminCoursesInput {
  return courseFiltersSchema.parse(searchParams)
}

function stringValue(fallback: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value : fallback),
    z.string()
  )
}

function positiveInteger(fallback: number) {
  return z
    .preprocess(
      (value) => (typeof value === "string" ? Number(value) : Number.NaN),
      z.number().int().positive()
    )
    .catch(fallback)
}
