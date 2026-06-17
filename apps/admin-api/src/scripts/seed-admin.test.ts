import { describe, expect, it } from "vitest"

import { createAdminAuth } from "@/auth/admin-auth"
import { createSeedAdminUserRow } from "@/scripts/seed-admin-user"
import { seedAdminUser } from "@/scripts/seed-admin"
import { adminRoles } from "@workspace/core/admin"
import { createInMemoryKwepDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

describe("seed admin user", () => {
  it("개발용 관리자 계정 row를 결정적으로 만든다", () => {
    const now = new Date("2026-06-14T00:00:00.000Z")

    expect(
      createSeedAdminUserRow({
        email: "admin@example.com",
        name: "관리자",
        now,
      })
    ).toEqual({
      createdAt: now,
      email: "admin@example.com",
      emailVerified: true,
      id: "admin-1",
      image: null,
      name: "관리자",
      role: adminRoles.owner,
      updatedAt: now,
    })
  })

  it("seed한 관리자 계정은 email/password로 로그인할 수 있다", async () => {
    const database = createInMemoryKwepDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })
      const auth = createAdminAuth({
        authBaseUrl: "http://localhost:4001",
        db: database.db,
        secret: "x".repeat(32),
        webOrigin: "http://localhost:3001",
      })
      const response = await auth.handler(
        new Request("http://localhost:4001/api/auth/sign-in/email", {
          body: JSON.stringify({
            email: "admin@example.com",
            password: "admin-password-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3001",
          },
          method: "POST",
        })
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        user: {
          email: "admin@example.com",
          role: adminRoles.owner,
        },
      })
    } finally {
      database.close()
    }
  })

  it("기존 credential 비밀번호는 resetPassword가 없으면 바꾸지 않는다", async () => {
    const database = createInMemoryKwepDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-15T00:00:00.000Z"),
        password: "changed-password-123",
      })
      const auth = createAdminAuth({
        authBaseUrl: "http://localhost:4001",
        db: database.db,
        secret: "x".repeat(32),
        webOrigin: "http://localhost:3001",
      })

      await expect(
        requestAdminEmailSignIn(auth, "admin-password-123")
      ).resolves.toBe(200)
      await expect(
        requestAdminEmailSignIn(auth, "changed-password-123")
      ).resolves.not.toBe(200)
    } finally {
      database.close()
    }
  })

  it("resetPassword가 true이면 기존 credential 비밀번호를 갱신한다", async () => {
    const database = createInMemoryKwepDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-15T00:00:00.000Z"),
        password: "changed-password-123",
        resetPassword: true,
      })
      const auth = createAdminAuth({
        authBaseUrl: "http://localhost:4001",
        db: database.db,
        secret: "x".repeat(32),
        webOrigin: "http://localhost:3001",
      })

      await expect(
        requestAdminEmailSignIn(auth, "changed-password-123")
      ).resolves.toBe(200)
    } finally {
      database.close()
    }
  })
})

async function requestAdminEmailSignIn(
  auth: ReturnType<typeof createAdminAuth>,
  password: string
): Promise<number> {
  const response = await auth.handler(
    new Request("http://localhost:4001/api/auth/sign-in/email", {
      body: JSON.stringify({
        email: "admin@example.com",
        password,
      }),
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })
  )

  return response.status
}
