import {
  and,
  eq,
  gt,
  lt,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm"

import type {
  LearnerCourseCursorCondition,
  LearnerKeysetCursorCondition,
  LearnerProgressCursorCondition,
} from "@workspace/core/learning"

type LearnerCursorColumns = {
  readonly courseId: SQLWrapper
  readonly primary: SQLWrapper
}

export function toLearnerCourseCursorPredicate(
  columns: LearnerCursorColumns,
  condition: LearnerCourseCursorCondition
): SQL | undefined {
  return toLearnerCursorPredicate(columns, condition, (primary) => primary)
}

export function toLearnerProgressCursorPredicate(
  columns: LearnerCursorColumns,
  condition: LearnerProgressCursorCondition
): SQL | undefined {
  return toLearnerCursorPredicate(
    columns,
    condition,
    (primary) => new Date(primary)
  )
}

function toLearnerCursorPredicate<TPrimary extends number | string>(
  columns: LearnerCursorColumns,
  condition: LearnerKeysetCursorCondition<TPrimary>,
  toDatabasePrimary: (primary: TPrimary) => unknown
): SQL | undefined {
  switch (condition.kind) {
    case "first-page":
      return undefined
    case "invalid-primary":
      return sql`0`
    case "after": {
      const primary = toDatabasePrimary(condition.primary)
      const primaryComparison =
        condition.primaryOrder === "descending"
          ? lt(columns.primary, primary)
          : gt(columns.primary, primary)

      return or(
        primaryComparison,
        and(
          eq(columns.primary, primary),
          gt(columns.courseId, condition.courseId)
        )
      )
    }
  }
}
