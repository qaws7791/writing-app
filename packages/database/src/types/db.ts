import type { InferSelectModel } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import type {
  account,
  schema,
  session,
  user,
  verification,
} from "../schema/index"

export type DbSchema = typeof schema
export type DbClient = BunSQLiteDatabase<DbSchema>
export type DbTransaction = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T
) => unknown
  ? T
  : never
export type DbExecutor = DbClient | DbTransaction

export type AccountRow = InferSelectModel<typeof account>
export type SessionRow = InferSelectModel<typeof session>
export type UserRow = InferSelectModel<typeof user>
export type VerificationRow = InferSelectModel<typeof verification>
