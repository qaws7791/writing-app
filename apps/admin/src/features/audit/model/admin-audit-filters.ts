import { adminAuditCategorySchema } from "@workspace/contracts/operations/admin-audit"
import { z } from "zod"

import type { ReadAdminAuditEventsInput } from "@/entities/admin-audit/model/admin-audit"

const platformDayKeyPattern = /^\d{4}-\d{2}-\d{2}$/u

const auditFiltersSchema = z.object({
  category: z
    .preprocess(
      (value) => (typeof value === "string" ? value : ""),
      z.union([z.literal(""), adminAuditCategorySchema])
    )
    .catch(""),
  from: dayKey(),
  page: positiveInteger(1),
  pageSize: positiveInteger(50),
  to: dayKey(),
})

export function parseAdminAuditFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminAuditEventsInput {
  return auditFiltersSchema.parse(searchParams)
}

/** 조회 API는 빈 조건을 생략으로 받으므로 표시용 빈 문자열을 여기서 걷어낸다. */
export function toAdminAuditEventsQuery(filters: ReadAdminAuditEventsInput) {
  return {
    ...(filters.category === "" ? {} : { category: filters.category }),
    ...(filters.from === "" ? {} : { from: filters.from }),
    page: filters.page,
    pageSize: filters.pageSize,
    ...(filters.to === "" ? {} : { to: filters.to }),
  }
}

function dayKey() {
  return z.preprocess(
    (value) =>
      typeof value === "string" && platformDayKeyPattern.test(value)
        ? value
        : "",
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
