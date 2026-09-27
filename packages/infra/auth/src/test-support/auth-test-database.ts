import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { createInMemoryWritingAppDatabase } from "@workspace/db/test-support/d1-database"
import type { WritingAppDatabase } from "@workspace/db/client"

import {
  adminAuthAccounts,
  adminAuthRateLimits,
  adminAuthSessions,
  adminAuthUsers,
  adminAuthVerifications,
  authAccounts,
  authRateLimits,
  authSessions,
  authUsers,
  authVerifications,
} from "#auth/schema/index"
import { createSqliteAuthDatabaseAdapter } from "#auth/sqlite-database"

export type AuthTestDatabase = WritingAppDatabase

export async function createAuthTestDatabase(): Promise<{
  readonly close: () => Promise<void>
  readonly db: AuthTestDatabase
}> {
  const client = await createInMemoryWritingAppDatabase()

  await runCurrentTestMigration(client.sqlite)

  return { close: () => client.close(), db: client.db }
}

export function createLearnerAuthDatabaseAdapter(database: AuthTestDatabase) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      account: authAccounts,
      rateLimit: authRateLimits,
      session: authSessions,
      user: authUsers,
      verification: authVerifications,
    },
  })
}

export function createAdminAuthDatabaseAdapter(database: AuthTestDatabase) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      admin_account: adminAuthAccounts,
      rateLimit: adminAuthRateLimits,
      admin_session: adminAuthSessions,
      admin_user: adminAuthUsers,
      admin_verification: adminAuthVerifications,
    },
  })
}

export function readSetCookiePair(response: Response): string {
  return (response.headers.get("set-cookie") ?? "")
    .split(/,(?=\s*[^;,]+=)/u)
    .map((value) => value.trim().split(";")[0])
    .filter(Boolean)
    .join("; ")
}
