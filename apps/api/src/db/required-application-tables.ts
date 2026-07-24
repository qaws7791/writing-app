import { getTableName, is, Table } from "drizzle-orm"

import * as applicationSchema from "@/db/schema"

/** Shared diagnostic contract; mutation could silently remove required-table checks. */
export const requiredApplicationTableNames = Object.freeze(
  [
    ...new Set(
      Object.values(applicationSchema).flatMap((value) =>
        is(value, Table) ? [getTableName(value)] : []
      )
    ),
  ].sort()
)

/** Shared backup contract; mutation could omit application tables from a backup. */
export const requiredApplicationBackupTableNames = Object.freeze([
  "api_schema_migrations",
  ...requiredApplicationTableNames,
])
