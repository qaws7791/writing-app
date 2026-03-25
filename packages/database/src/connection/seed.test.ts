import { afterEach, describe, expect, test } from "bun:test"

import { account, user } from "../schema/index.js"
import { createTestDb } from "../testing/index.js"

import { seedTestUsers, type SeedTestUser } from "./index.js"

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

function makeTestUser(overrides: Partial<SeedTestUser> = {}): SeedTestUser {
  return {
    accountRecordId: "acc-1",
    email: "test@example.com",
    name: "테스트 사용자",
    passwordHash: "fakehash",
    userId: "user-1",
    ...overrides,
  }
}

describe("seedTestUsers", () => {
  test("empty list is a no-op", async () => {
    const { cleanup, db } = await createTestDb({ withTestUser: false })
    cleanupTasks.push(cleanup)

    seedTestUsers(db, [])

    const users = db.select().from(user).all()
    expect(users).toHaveLength(0)
  })

  test("inserts user row with emailVerified = true", async () => {
    const { cleanup, db } = await createTestDb({ withTestUser: false })
    cleanupTasks.push(cleanup)

    seedTestUsers(db, [makeTestUser()])

    const users = db.select().from(user).all()
    expect(users).toHaveLength(1)
    expect(users[0]?.email).toBe("test@example.com")
    expect(users[0]?.name).toBe("테스트 사용자")
    expect(users[0]?.emailVerified).toBe(true)
  })

  test("inserts account row with credential provider and password hash", async () => {
    const { cleanup, db } = await createTestDb({ withTestUser: false })
    cleanupTasks.push(cleanup)

    seedTestUsers(db, [makeTestUser({ passwordHash: "scrypt:salt:key" })])

    const accounts = db.select().from(account).all()
    expect(accounts).toHaveLength(1)
    expect(accounts[0]?.providerId).toBe("credential")
    expect(accounts[0]?.password).toBe("scrypt:salt:key")
    expect(accounts[0]?.userId).toBe("user-1")
  })

  test("inserts multiple users in a single call", async () => {
    const { cleanup, db } = await createTestDb({ withTestUser: false })
    cleanupTasks.push(cleanup)

    seedTestUsers(db, [
      makeTestUser({
        accountRecordId: "acc-1",
        email: "a@example.com",
        userId: "user-1",
      }),
      makeTestUser({
        accountRecordId: "acc-2",
        email: "b@example.com",
        userId: "user-2",
      }),
    ])

    const users = db.select().from(user).all()
    const accounts = db.select().from(account).all()
    expect(users).toHaveLength(2)
    expect(accounts).toHaveLength(2)
    expect(users.map((u) => u.email).sort()).toEqual([
      "a@example.com",
      "b@example.com",
    ])
  })

  test("is idempotent — duplicate calls do not throw or duplicate rows", async () => {
    const { cleanup, db } = await createTestDb({ withTestUser: false })
    cleanupTasks.push(cleanup)

    const testUser = makeTestUser()
    seedTestUsers(db, [testUser])
    seedTestUsers(db, [testUser])

    const users = db.select().from(user).all()
    const accounts = db.select().from(account).all()
    expect(users).toHaveLength(1)
    expect(accounts).toHaveLength(1)
  })
})
