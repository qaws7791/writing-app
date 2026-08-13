import { writingDomainSchema } from "@workspace/contracts/writing/writing"
import { adminWritingTaskStatusFilterSchema } from "@workspace/contracts/writing/admin-writing-tasks"
import { z } from "zod"

import type { ReadAdminWritingTasksInput } from "@/features/writing-tasks/model/admin-writing-tasks"

const writingTaskFiltersSchema = z.object({
  domain: z.preprocess(
    (value) => (typeof value === "string" && value.length > 0 ? value : "all"),
    z.union([z.literal("all"), writingDomainSchema])
  ),
  page: positiveInteger(1),
  pageSize: positiveInteger(20),
  query: stringValue(""),
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value : "all"),
      adminWritingTaskStatusFilterSchema
    )
    .catch("all"),
})

export function parseAdminWritingTaskFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminWritingTasksInput {
  return writingTaskFiltersSchema.parse(searchParams)
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
