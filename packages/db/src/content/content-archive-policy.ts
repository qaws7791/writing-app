import { sql } from "drizzle-orm"
import { contentStatuses } from "@workspace/core/status"

import type { KwepDatabase } from "@workspace/db/client"
import type { ContentSeedRows } from "@workspace/db/seeds/seed-content"

type KwepDatabaseTransaction = Parameters<
  Parameters<KwepDatabase["transaction"]>[0]
>[0]

type ContentTableName = "course_units" | "courses" | "lesson_steps" | "lessons"

export function archiveContentRowsOutsideSeed(
  transaction: KwepDatabaseTransaction,
  rows: ContentSeedRows
): number {
  return (
    archiveRowsNotIn(
      transaction,
      "courses",
      rows.courses.map((row) => row.id)
    ) +
    archiveRowsNotIn(
      transaction,
      "course_units",
      rows.units.map((row) => row.id)
    ) +
    archiveRowsNotIn(
      transaction,
      "lessons",
      rows.lessons.map((row) => row.id)
    ) +
    archiveRowsNotIn(
      transaction,
      "lesson_steps",
      rows.steps.map((row) => row.id)
    )
  )
}

function archiveRowsNotIn(
  transaction: KwepDatabaseTransaction,
  tableName: ContentTableName,
  activeIds: readonly string[]
): number {
  const whereCondition =
    activeIds.length === 0
      ? sql`${sql.identifier("status")} != ${contentStatuses.archived}`
      : sql`${sql.identifier("status")} != ${contentStatuses.archived} AND ${sql.identifier("id")} NOT IN (${sql.join(
          activeIds.map((id) => sql`${id}`),
          sql`, `
        )})`

  transaction.run(
    sql`UPDATE ${sql.identifier(tableName)} SET ${sql.identifier("status")} = ${contentStatuses.archived} WHERE ${whereCondition}`
  )

  return (
    transaction
      .select({ value: sql<number>`changes()` })
      .from(sql`(SELECT 1)`)
      .get()?.value ?? 0
  )
}
