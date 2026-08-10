import { describe, expect, it } from "vitest"

import { createAdminAuthRuntime } from "#auth/admin/server"
import { adminAuthAccounts, adminAuthUsers } from "#auth/schema/index"
import {
  createAdminAuthDatabaseAdapter,
  createAuthTestDatabase,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

const webOrigin = "http://localhost:3001"

describe("admin authentication", () => {
  it("rejects public sign-up without creating an admin user or account", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createTestRuntime(database.db)

      const response = await runtime.authHandler(
        new Request("http://api.localhost:4000/api/admin/auth/sign-up/email", {
          body: JSON.stringify({
            email: "new-admin@example.com",
            name: "새 관리자",
            password: "Admin-password-123!",
          }),
          headers: {
            "Content-Type": "application/json",
            Origin: webOrigin,
          },
          method: "POST",
        })
      )

      expect(response.status).toBe(404)
      expect(database.db.select().from(adminAuthUsers).all()).toEqual([])
      expect(database.db.select().from(adminAuthAccounts).all()).toEqual([])
    } finally {
      database.close()
    }
  })
})

function createTestRuntime(database: AuthTestDatabase) {
  return createAdminAuthRuntime({
    database: createAdminAuthDatabaseAdapter(database),
    secret: "admin-test-secret-0123456789abcdef",
    sessionRevoker: { revokeAllForAdmin() {} },
    webOrigin,
  })
}
