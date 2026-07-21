import { describe, expect, it, vi } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
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

import {
  createAdminAuthDatabase,
  createLearnerAuthDatabase,
} from "@/adapters/auth/auth-sqlite-database"

const authDatabaseMocks = vi.hoisted(() => ({
  createSqliteAuthDatabaseAdapter: vi.fn(() => ({ kind: "auth-database" })),
}))

vi.mock("@workspace/auth/sqlite-database", () => ({
  createSqliteAuthDatabaseAdapter:
    authDatabaseMocks.createSqliteAuthDatabaseAdapter,
}))

describe("API 인증 database mapping", () => {
  it("학습자 Better Auth core model key를 app-owned schema에 매핑한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLearnerAuthDatabase(database.db)

      expect(
        authDatabaseMocks.createSqliteAuthDatabaseAdapter
      ).toHaveBeenCalledWith({
        database: database.db,
        schema: expect.objectContaining({
          account: authAccounts,
          session: authSessions,
          user: authUsers,
          verification: authVerifications,
        }),
      })
    } finally {
      database.close()
    }
  })

  it("관리자 Better Auth model key를 분리된 관리자 schema에 매핑한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createAdminAuthDatabase(database.db)

      expect(
        authDatabaseMocks.createSqliteAuthDatabaseAdapter
      ).toHaveBeenCalledWith({
        database: database.db,
        schema: expect.objectContaining({
          admin_account: adminAuthAccounts,
          admin_session: adminAuthSessions,
          admin_user: adminAuthUsers,
          admin_verification: adminAuthVerifications,
        }),
      })
    } finally {
      database.close()
    }
  })
})
