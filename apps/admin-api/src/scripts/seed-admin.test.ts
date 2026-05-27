import { verifyPassword } from "better-auth/crypto"
import { describe, expect, test } from "vitest"

import { adminAccount, adminUser } from "@workspace/db/schema"

import { type AdminSeedDatabase, seedAdminUser } from "@/scripts/seed-admin"

type AdminUserInsert = typeof adminUser.$inferInsert
type AdminAccountInsert = typeof adminAccount.$inferInsert

function createSeedTestDatabase() {
  const users: AdminUserInsert[] = []
  const accounts: AdminAccountInsert[] = []

  function insert(table: typeof adminUser): {
    values(value: AdminUserInsert): Promise<void>
  }
  function insert(table: typeof adminAccount): {
    values(value: AdminAccountInsert): Promise<void>
  }
  function insert(table: typeof adminUser | typeof adminAccount) {
    return {
      async values(value: AdminUserInsert | AdminAccountInsert) {
        if (table === adminUser) {
          users.push(value as AdminUserInsert)
          return
        }

        accounts.push(value as AdminAccountInsert)
      },
    }
  }

  const db: AdminSeedDatabase = {
    query: {
      adminUser: {
        async findFirst(input) {
          let requestedEmail = ""

          input.where(adminUser, {
            eq(_left, right) {
              requestedEmail = right
              return true
            },
          })

          return users.find((user) => user.email === requestedEmail)
        },
      },
    },
    async transaction<T>(
      callback: (tx: {
        insert(table: typeof adminUser): {
          values(value: AdminUserInsert): Promise<void>
        }
        insert(table: typeof adminAccount): {
          values(value: AdminAccountInsert): Promise<void>
        }
        update(table: typeof adminAccount): {
          set(value: Partial<AdminAccountInsert>): {
            where(condition: unknown): Promise<void>
          }
        }
      }) => Promise<T>
    ) {
      return callback({
        insert,
        update(table: typeof adminAccount) {
          return {
            set(value: Partial<AdminAccountInsert>) {
              return {
                async where(_condition: unknown) {
                  if (table !== adminAccount) {
                    return
                  }

                  for (const account of accounts) {
                    Object.assign(account, value)
                  }
                },
              }
            },
          }
        },
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
