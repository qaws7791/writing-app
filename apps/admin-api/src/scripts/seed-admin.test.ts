import { Database } from "bun:sqlite"
import { verifyPassword } from "better-auth/crypto"
import { describe, expect, test } from "vitest"

import {
  adminAccount,
  adminUser,
  createDatabase,
  runContentMigration,
} from "@workspace/db"

import { seedAdminUser } from "@/scripts/seed-admin"

describe("seedAdminUser", () => {
  test("관리자 사용자와 credential account를 한 번만 생성한다", async () => {
    const sqlite = new Database(":memory:")
    runContentMigration(sqlite)
    const db = createDatabase(sqlite)

    const input = {
      email: "admin@example.com",
      name: "관리자",
      password: "password-1234",
    }

    const firstResult = await seedAdminUser(db, input)
    const secondResult = await seedAdminUser(db, input)

    expect(firstResult).toEqual({ status: "created" })
    expect(secondResult).toEqual({ status: "already-exists" })

    const users = await db.select().from(adminUser)
    const accounts = await db.select().from(adminAccount)

    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({
      email: input.email,
      emailVerified: true,
      name: input.name,
    })
    expect(accounts).toHaveLength(1)
    expect(accounts[0]?.providerId).toBe("credential")
    expect(accounts[0]?.password).toEqual(expect.any(String))
    expect(accounts[0]?.password).not.toBe(input.password)
    expect(
      await verifyPassword({
        hash: accounts[0]?.password ?? "",
        password: input.password,
      })
    ).toBe(true)
  })
})
