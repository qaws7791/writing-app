import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { userIdSchema } from "@workspace/contracts/identity/data"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { authUsers, learnerProfiles } from "@workspace/db/schema"

import { createAdminUserRepository } from "@/adapters/identity/admin-user-drizzle.repository"

describe("통합 관리자 identity DB adapter", () => {
  it("사용자 조회, 상태 변경과 soft-delete를 target app 소유 adapter에서 유지한다", async () => {
    const client = createWritingAppDatabase(":memory:")
    const userId = userIdSchema.parse("user-1")
    const now = new Date("2026-07-18T00:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      seedUser(client.db, now)
      const repository = createAdminUserRepository(client.db)

      await expect(
        repository.readUsers({
          page: 1,
          pageSize: 20,
          query: "학습자",
          sort: "lastActive",
          status: "all",
        })
      ).resolves.toMatchObject({
        items: [
          {
            email: "learner@example.com",
            id: "user-1",
            name: "학습자",
            status: "active",
          },
        ],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      })

      await expect(
        repository.updateUserStatus({
          now,
          status: "suspended",
          userId,
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { id: "user-1", status: "suspended" },
      })
      expect(readProfile(client.db, userId)).toEqual({
        deletedAt: null,
        status: "suspended",
      })

      await expect(repository.deleteUser({ now, userId })).resolves.toEqual({
        kind: "ok",
      })
      expect(readProfile(client.db, userId)).toEqual({
        deletedAt: now,
        status: "deleted",
      })
    } finally {
      client.close()
    }
  })
})

function seedUser(
  database: ReturnType<typeof createWritingAppDatabase>["db"],
  now: Date
): void {
  database
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner@example.com",
      emailVerified: true,
      id: "user-1",
      image: null,
      name: "학습자",
      updatedAt: now,
    })
    .run()
  database
    .insert(learnerProfiles)
    .values({
      deletedAt: null,
      displayName: "학습자",
      status: "active",
      userId: "user-1",
    })
    .run()
}

function readProfile(
  database: ReturnType<typeof createWritingAppDatabase>["db"],
  userId: ReturnType<typeof userIdSchema.parse>
) {
  return database
    .select({
      deletedAt: learnerProfiles.deletedAt,
      status: learnerProfiles.status,
    })
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .get()
}
