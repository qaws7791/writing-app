import { verifyPassword } from "better-auth/crypto"
import { describe, expect, test } from "vitest"

import {
  type AdminSeedDatabase,
  seedAdminUser,
} from "@/scripts/seed-admin-user"

interface AdminUserRecord {
  createdAt: Date
  email: string
  emailVerified: boolean
  id: string
  name: string
  updatedAt: Date
}

interface AdminAccountRecord {
  accountId: string
  createdAt: Date
  id: string
  password: string
  providerId: string
  updatedAt: Date
  userId: string
}

function createSeedTestDatabase() {
  const users: AdminUserRecord[] = []
  const accounts: AdminAccountRecord[] = []

  const db: AdminSeedDatabase = {
    async createAdminUserWithCredential(input) {
      users.push({
        createdAt: input.createdAt,
        email: input.email,
        emailVerified: true,
        id: input.userId,
        name: input.name,
        updatedAt: input.updatedAt,
      })

      accounts.push({
        accountId: input.userId,
        createdAt: input.createdAt,
        id: input.accountId,
        password: input.passwordHash,
        providerId: "credential",
        updatedAt: input.updatedAt,
        userId: input.userId,
      })
    },
    async findAdminUserByEmail(email) {
      return users.find((user) => user.email === email)
    },
    async updateCredentialPassword(input) {
      accounts
        .filter(
          (account) =>
            account.userId === input.userId &&
            account.providerId === "credential"
        )
        .forEach((account) => {
          account.password = input.passwordHash
          account.updatedAt = input.updatedAt
        })
    },
  }

  return { accounts, db, users }
}

describe("seedAdminUser", () => {
  test("관리자 사용자와 credential account를 한 번만 생성한다", async () => {
    const { accounts, db, users } = createSeedTestDatabase()

    const input = {
      email: "admin@example.com",
      name: "관리자",
      password: "password-1234",
    }

    const firstResult = await seedAdminUser(db, input)
    const secondResult = await seedAdminUser(db, input)

    expect(firstResult).toEqual({ status: "created" })
    expect(secondResult).toEqual({ status: "already-exists" })

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

  test("로그인 조회와 맞도록 이메일을 소문자로 저장한다", async () => {
    const { db, users } = createSeedTestDatabase()

    const firstResult = await seedAdminUser(db, {
      email: "Admin@Example.com",
      name: "관리자",
      password: "password-1234",
    })
    const secondResult = await seedAdminUser(db, {
      email: "admin@example.com",
      name: "관리자",
      password: "password-1234",
    })

    expect(firstResult).toEqual({ status: "created" })
    expect(secondResult).toEqual({ status: "already-exists" })
    expect(users).toMatchObject([
      {
        email: "admin@example.com",
      },
    ])
  })

  test("옵션이 켜지면 기존 관리자 credential 비밀번호를 갱신한다", async () => {
    const { accounts, db } = createSeedTestDatabase()

    await seedAdminUser(db, {
      email: "admin@example.com",
      name: "관리자",
      password: "old-password",
    })

    const result = await seedAdminUser(db, {
      email: "admin@example.com",
      name: "관리자",
      password: "new-password",
      resetExistingPassword: true,
    })

    expect(result).toEqual({ status: "password-updated" })
    expect(accounts).toHaveLength(1)
    expect(
      await verifyPassword({
        hash: accounts[0]?.password ?? "",
        password: "new-password",
      })
    ).toBe(true)
    expect(
      await verifyPassword({
        hash: accounts[0]?.password ?? "",
        password: "old-password",
      })
    ).toBe(false)
  })
})
