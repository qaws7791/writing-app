import { sql, type SQL, type SQLWrapper } from "drizzle-orm"
import {
  check,
  integer,
  sqliteTable,
  SQLiteAsyncDialect,
} from "drizzle-orm/sqlite-core"
import type { WritingAppDatabase } from "#db/client"

export type DatabaseStatement = SQLWrapper

const batchPrecondition = sqliteTable(
  "batch_precondition",
  {
    id: integer("id").primaryKey(),
    valid: integer("valid").notNull(),
  },
  (table) => [check("batch_precondition_valid", sql`${table.valid} = 1`)]
)

// A failed CHECK rolls back the entire D1 batch, including earlier statements.
export function requireBatchCondition(
  database: WritingAppDatabase,
  condition: SQL
): DatabaseStatement {
  const valid = sql<number>`CASE WHEN ${condition} THEN 1 ELSE 0 END`
  return database
    .insert(batchPrecondition)
    .values({ id: 1, valid })
    .onConflictDoUpdate({ target: batchPrecondition.id, set: { valid } })
}

export async function executeBatch(
  database: WritingAppDatabase,
  statements: readonly DatabaseStatement[]
): Promise<void> {
  if (statements.length === 0) return
  const dialect = new SQLiteAsyncDialect()
  await database.$client.batch(
    statements.map((statement) => {
      const query = dialect.sqlToQuery(statement.getSQL())
      return database.$client.prepare(query.sql).bind(...query.params)
    })
  )
}

export function isBatchConflict(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    error.message.includes("batch_precondition_valid") ||
    isBatchConflict(error.cause)
  )
}
