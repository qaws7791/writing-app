import { learnerAccountStatusSchema } from "@workspace/contracts/identity/status"
import { z } from "zod"

import type { ReadAdminUsersInput } from "@/entities/learner-account/model/admin-learner-account"

const adminUserSortSchema = z.enum([
  "joined",
  "lastActive",
  "lessonsDone",
  "streak",
])
const userFiltersSchema = z.object({
  cursor: z.string().min(1).max(2_048).optional(),
  direction: z.enum(["next", "previous"]).catch("next"),
  pageSize: positiveInteger(20),
  query: stringValue(""),
  sort: z
    .preprocess(
      (value) => (typeof value === "string" ? value : "lastActive"),
      adminUserSortSchema
    )
    .catch("lastActive"),
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value : "all"),
      z.union([z.literal("all"), learnerAccountStatusSchema])
    )
    .catch("all"),
})

export function parseAdminUserFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminUsersInput {
  const parsed = userFiltersSchema.parse(searchParams)
  return { ...parsed, cursor: parsed.cursor }
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
