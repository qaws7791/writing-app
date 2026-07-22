import { createSqliteAuthDatabaseAdapter } from "@workspace/auth/sqlite-database"
import {
  adminAuthRateLimits,
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  adminAuthVerifications,
  authRateLimits,
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import * as dbSchema from "@workspace/db/schema"

export function createLearnerAuthDatabase(database: WritingAppDatabase) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      ...dbSchema,
      account: authAccounts,
      rateLimit: authRateLimits,
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
      rateLimit: adminAuthRateLimits,
      admin_session: adminAuthSessions,
      admin_user: adminAuthUsers,
      admin_verification: adminAuthVerifications,
    },
  })
}
