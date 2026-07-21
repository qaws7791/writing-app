import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { authUsers, learnerProfiles } from "@workspace/db/schema"

import {
  createDrizzleLearnerProfileRepository,
  createDrizzleLearnerTestAuthDisplayNameSynchronizer,
} from "@/adapters/auth/learner-profile-drizzle.repository"

describe("학습자 profile SQLite repository", () => {
  it("profile ensure를 멱등하게 처리하고 기존 표시 이름을 덮어쓰지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const repository = createDrizzleLearnerProfileRepository(database.db)

    try {
      runBaselineMigration(database.sqlite)
      insertAuthUser(database.db, "learner-1")

      await repository.ensureActiveProfile({
        displayName: "첫 이름",
        userId: "learner-1",
      })
      await repository.ensureActiveProfile({
        displayName: "바뀌면 안 되는 이름",
        userId: "learner-1",
      })

      await expect(
        repository.findProfileByUserId("learner-1")
      ).resolves.toEqual({ status: "active" })
      expect(
        database.db
          .select({ displayName: learnerProfiles.displayName })
          .from(learnerProfiles)
          .get()?.displayName
      ).toBe("첫 이름")
    } finally {
      database.close()
    }
  })

  it("기존 suspended profile을 active로 되돌리지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const repository = createDrizzleLearnerProfileRepository(database.db)

    try {
      runBaselineMigration(database.sqlite)
      insertAuthUser(database.db, "learner-2")
      database.db
        .insert(learnerProfiles)
        .values({
          deletedAt: null,
          displayName: "정지 학습자",
          status: "suspended",
          userId: "learner-2",
        })
        .run()

      await repository.ensureActiveProfile({
        displayName: "정지 학습자",
        userId: "learner-2",
      })

      await expect(
        repository.findProfileByUserId("learner-2")
      ).resolves.toEqual({ status: "suspended" })
    } finally {
      database.close()
    }
  })

  it("테스트 사용자 표시 이름을 auth user와 learner profile에 동기화한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      insertAuthUser(database.db, "learner-3")
      database.db
        .insert(learnerProfiles)
        .values({
          deletedAt: null,
          displayName: "이전 이름",
          status: "active",
          userId: "learner-3",
        })
        .run()

      await createDrizzleLearnerTestAuthDisplayNameSynchronizer(
        database.db
      ).synchronizeDisplayName({
        displayName: "글쓰기 탐험가",
        updatedAt: new Date("2026-07-22T00:00:00.000Z"),
        userId: "learner-3",
      })

      expect(
        database.db.select({ name: authUsers.name }).from(authUsers).get()
      ).toEqual({ name: "글쓰기 탐험가" })
      expect(
        database.db
          .select({ displayName: learnerProfiles.displayName })
          .from(learnerProfiles)
          .get()
      ).toEqual({ displayName: "글쓰기 탐험가" })
    } finally {
      database.close()
    }
  })
})

function insertAuthUser(
  database: ReturnType<typeof createInMemoryWritingAppDatabase>["db"],
  userId: string
): void {
  const now = new Date("2026-07-17T00:00:00.000Z")

  database
    .insert(authUsers)
    .values({
      createdAt: now,
      email: `${userId}@example.com`,
      emailVerified: true,
      id: userId,
      name: userId,
      updatedAt: now,
    })
    .run()
}
