import { createSqliteAuthDatabaseAdapter } from "@workspace/auth/sqlite-database"
import type { WritingAppDatabase } from "@workspace/db"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  adminAuthVerifications,
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "@workspace/db/schema"
import * as dbSchema from "@workspace/db/schema"

export function createLearnerAuthDatabase(database: WritingAppDatabase) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      ...dbSchema,
      account: authAccounts,
      session: authSessions,
      user: authUsers,
      verification: authVerifications,
    },
  })
}

export function createAdminAuthDatabase(database: WritingAppDatabase) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      ...dbSchema,
      admin_account: adminAuthAccounts,
      admin_session: adminAuthSessions,
      admin_user: adminAuthUsers,
      admin_verification: adminAuthVerifications,
    },
  })
}
