import { afterEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { createTestDb, type TestDatabase } from "../testing/create-test-db"
import { user } from "../schema/auth"
import { createRepositoryTransactionManager } from "./create-repository-transaction-manager"

describe("createRepositoryTransactionManager", () => {
  let database: TestDatabase | null = null

  afterEach(async () => {
    if (database) {
      await database.cleanup()
      database = null
    }
  })

  it("rolls back work when the transaction callback throws", async () => {
    database = await createTestDb()
    const transactionManager = createRepositoryTransactionManager(database.db)

    await expect(
      transactionManager.run(async () => {
        await database?.db.insert(user).values({
          createdAt: new Date("2026-03-21T00:00:00.000Z"),
          email: "rollback@example.com",
          emailVerified: true,
          id: "rollback-user",
          name: "Rollback",
          updatedAt: new Date("2026-03-21T00:00:00.000Z"),
        })

        throw new Error("force rollback")
      })
    ).rejects.toThrow("force rollback")

    const rows = await database.db
      .select()
      .from(user)
      .where(eq(user.id, "rollback-user"))

    expect(rows).toHaveLength(0)
  })
})
