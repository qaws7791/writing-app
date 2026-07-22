import { describe, expect, it } from "vitest"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { adminAuthSessions, adminAuthUsers } from "@workspace/db/schema"

import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"

describe("관리자 session revoker", () => {
  it("대상 관리자의 모든 session만 삭제한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const now = new Date("2026-07-18T00:00:00.000Z")

    try {
      runBaselineMigration(database.sqlite)
      database.db
        .insert(adminAuthUsers)
        .values([
          createAdminUser("admin-1", now),
          createAdminUser("admin-2", now),
        ])
        .run()
      database.db
        .insert(adminAuthSessions)
        .values([
          createAdminSession("session-1", "admin-1", now),
          createAdminSession("session-2", "admin-1", now),
          createAdminSession("session-3", "admin-2", now),
        ])
        .run()

      await createDrizzleAdminSessionRevoker(database.db).revokeAllForAdmin(
        adminIdSchema.parse("admin-1")
      )

      expect(
        database.db
          .select({ userId: adminAuthSessions.userId })
          .from(adminAuthSessions)
          .all()
      ).toEqual([{ userId: "admin-2" }])
    } finally {
      database.close()
    }
  })
})

function createAdminUser(id: string, now: Date) {
  return {
    createdAt: now,
    email: `${id}@example.test`,
    emailVerified: true,
    id,
    image: null,
    name: id,
    updatedAt: now,
  }
}

function createAdminSession(id: string, userId: string, now: Date) {
  return {
    createdAt: now,
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id,
    token: `${id}-token`,
    updatedAt: now,
    userId,
  }
}
