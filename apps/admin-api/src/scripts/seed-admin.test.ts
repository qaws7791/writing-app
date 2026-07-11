import { describe, expect, it } from "vitest"

import { createAdminAuth } from "@/auth/admin-auth"
import {
  createSeedAdminRows,
  createSeedAdminUserRow,
} from "@/scripts/seed-admin-user"
import { parseSeedAdminEnvironment, seedAdminUser } from "@/scripts/seed-admin"
import { adminRoles } from "@workspace/core/admin"
import { adminAuthUsers } from "@workspace/db"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

describe("seed admin user", () => {
  it.each([
    [{ ADMIN_SEED_PASSWORD: "Strong-admin-123!" }, "ADMIN_SEED_EMAIL"],
    [{ ADMIN_SEED_EMAIL: "owner@example.com" }, "ADMIN_SEED_PASSWORD"],
    [
      {
        ADMIN_SEED_EMAIL: "owner@example.com",
        ADMIN_SEED_PASSWORD: "replace-with-local-admin-password",
      },
      "placeholder",
    ],
    [
      {
        ADMIN_SEED_EMAIL: "owner@example.com",
        ADMIN_SEED_PASSWORD: "aaaaaaaaaaaaaaaa",
      },
      "문자 종류",
    ],
  ])(
    "필수 credential이 안전하지 않으면 DB를 열기 전에 실패한다",
    (environment, message) => {
      expect(() => parseSeedAdminEnvironment(environment)).toThrow(message)
    }
  )

  it("운영 seed는 승인 flag와 대상 DB 확인값을 요구한다", () => {
    const environment = {
      ADMIN_SEED_EMAIL: "owner@example.com",
      ADMIN_SEED_PASSWORD: "Strong-admin-123!",
      DATABASE_URL: "file:/production/admin.sqlite",
      NODE_ENV: "production",
    }

    expect(() => parseSeedAdminEnvironment(environment)).toThrow(
      "ADMIN_SEED_PRODUCTION_APPROVED"
    )
    expect(() =>
      parseSeedAdminEnvironment({
        ...environment,
        ADMIN_SEED_PRODUCTION_APPROVED: "true",
        ADMIN_SEED_EXPECTED_DATABASE_URL: "file:/other/admin.sqlite",
      })
    ).toThrow("확인값")
  })

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

  it("개발용 관리자 credential row를 user row와 같은 seed 계약으로 만든다", () => {
    const now = new Date("2026-06-14T00:00:00.000Z")

    expect(
      createSeedAdminRows({
        email: "admin@example.com",
        name: "관리자",
        now,
        passwordHash: "hashed-password",
      })
    ).toEqual({
      account: {
        accessToken: null,
        accessTokenExpiresAt: null,
        accountId: "admin-1",
        createdAt: now,
        id: "admin-1-credential",
        idToken: null,
        password: "hashed-password",
        providerId: "credential",
        refreshToken: null,
        refreshTokenExpiresAt: null,
        scope: null,
        updatedAt: now,
        userId: "admin-1",
      },
      user: {
        createdAt: now,
        email: "admin@example.com",
        emailVerified: true,
        id: "admin-1",
        image: null,
        name: "관리자",
        role: adminRoles.owner,
        updatedAt: now,
      },
    })
  })

  it("seed한 관리자 계정은 email/password로 로그인할 수 있다", async () => {
    const database = createInMemoryWritingAppDatabase()

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
    const database = createInMemoryWritingAppDatabase()

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
    const database = createInMemoryWritingAppDatabase()

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

  it("credential 저장 실패 시 같은 transaction의 user 저장도 rollback한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      database.sqlite.exec(`
        CREATE TRIGGER reject_admin_account_insert
        BEFORE INSERT ON admin_account
        BEGIN
          SELECT RAISE(ABORT, 'fault injection');
        END;
      `)

      await expect(
        seedAdminUser(database.db, {
          email: "owner@example.com",
          name: "소유자",
          now: new Date("2026-06-14T00:00:00.000Z"),
          password: "Strong-admin-123!",
        })
      ).rejects.toThrow("fault injection")
      await expect(database.db.select().from(adminAuthUsers)).resolves.toEqual(
        []
      )
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
