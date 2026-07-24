import { sql } from "drizzle-orm"

export const forbiddenDatabaseValue = sql.raw("select 1")
