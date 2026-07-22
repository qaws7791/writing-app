import { sql } from "drizzle-orm"

import type { WritingAppDatabase } from "#db/client"
import { persistedContentStatuses } from "#db/persisted-values"
import type { ContentSeedRows } from "#db/seeds/seed-content"

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export function archiveContentRowsOutsideSeed(
  transaction: WritingAppDatabaseTransaction,
  rows: ContentSeedRows
): number {
  const activeCourseIds = rows.courses.map((row) => row.id)
  const whereCondition =
    activeCourseIds.length === 0
      ? sql`${sql.identifier("status")} != ${persistedContentStatuses.archived}`
      : sql`${sql.identifier("status")} != ${persistedContentStatuses.archived} AND ${sql.identifier("id")} NOT IN (${sql.join(
          activeCourseIds.map((id) => sql`${id}`),
          sql`, `
        )})`

  transaction.run(
    sql`UPDATE ${sql.identifier("courses")} SET ${sql.identifier("status")} = ${persistedContentStatuses.archived} WHERE ${whereCondition}`
  )

  return (
    transaction
      .select({ value: sql<number>`changes()` })
      .from(sql`(SELECT 1)`)
      .get()?.value ?? 0
  )
}
