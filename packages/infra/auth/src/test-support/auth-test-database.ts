import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import {
  createSqliteDatabase,
  type SqliteDatabaseClient,
} from "@workspace/db/sqlite-database"

import * as authSchema from "#auth/schema/index"
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
import { hashAuthPassword } from "#auth/password"
import { createSqliteAuthDatabaseAdapter } from "#auth/sqlite-database"

export type AuthTestDatabase = SqliteDatabaseClient<typeof authSchema>["db"]

export function createAuthTestDatabase(): {
  readonly close: () => void
  readonly db: AuthTestDatabase
} {
  const client = createSqliteDatabase({
    filename: ":memory:",
    schema: authSchema,
  })

  runCurrentTestMigration(client.sqlite)

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

export async function seedAdminOwner(
  database: AuthTestDatabase,
  input: Readonly<{
    adminId?: string
    email?: string
    name?: string
    now?: Date
    password: string
  }>
): Promise<void> {
  const adminId = input.adminId ?? "admin-1"
  const now = input.now ?? new Date("2026-07-18T00:00:00.000Z")
  const password = await hashAuthPassword(input.password)

  database
    .insert(adminAuthUsers)
    .values({
      createdAt: now,
      email: input.email ?? "owner@example.com",
      emailVerified: true,
      id: adminId,
      image: null,
      name: input.name ?? "소유자",
      updatedAt: now,
    })
    .run()
  database
    .insert(adminAuthAccounts)
    .values({
      accountId: adminId,
      createdAt: now,
      id: `${adminId}-credential`,
      password,
      providerId: "credential",
      updatedAt: now,
      userId: adminId,
    })
    .run()
}

export function readSetCookiePair(response: Response): string {
  return (response.headers.get("set-cookie") ?? "")
    .split(/,(?=\s*[^;,]+=)/u)
    .map((value) => value.trim().split(";")[0])
    .filter(Boolean)
    .join("; ")
}
