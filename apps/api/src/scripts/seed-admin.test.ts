import { describe, expect, it } from "vitest"
import {
  createAdminAuthRuntime,
  type AdminAuthRuntime,
} from "@workspace/auth/admin/server"
import { adminRoles } from "@workspace/core/admin"
import { adminAuthUsers } from "@workspace/auth/schema"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import { createAdminAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import {
  createSeedAdminRows,
  createSeedAdminUserRow,
} from "@/scripts/seed-admin-user"
import { parseSeedAdminEnvironment, seedAdminUser } from "@/scripts/seed-admin"

describe("통합 API 관리자 seed", () => {
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
    "안전하지 않은 credential은 DB를 열기 전에 거절한다",
    (environment, message) => {
      expect(() => parseSeedAdminEnvironment(environment)).toThrow(message)
    }
  )

  it("운영 seed는 승인 flag와 대상 DB 확인값을 요구한다", () => {
    const environment = {
      ADMIN_SEED_EMAIL: "owner@example.com",
      ADMIN_SEED_PASSWORD: "Strong-admin-123!",
      DATABASE_URL: "file:/production/api.sqlite",
      NODE_ENV: "production",
    }
    expect(() => parseSeedAdminEnvironment(environment)).toThrow(
      "ADMIN_SEED_PRODUCTION_APPROVED"
    )
    expect(() =>
      parseSeedAdminEnvironment({
        ...environment,
        ADMIN_SEED_EXPECTED_DATABASE_URL: "file:/other/api.sqlite",
        ADMIN_SEED_PRODUCTION_APPROVED: "true",
      })
    ).toThrow("확인값")
  })

  it("owner user와 credential row를 결정적으로 만든다", () => {
    const now = new Date("2026-06-14T00:00:00.000Z")
    expect(
      createSeedAdminUserRow({
        email: "admin@example.com",
        name: "관리자",
        now,
      })
    ).toMatchObject({
      email: "admin@example.com",
      id: "admin-1",
      name: "관리자",
      role: adminRoles.owner,
    })
    expect(
      createSeedAdminRows({
        email: "admin@example.com",
        name: "관리자",
        now,
        passwordHash: "hashed-password",
      }).account
    ).toMatchObject({
      accountId: "admin-1",
      id: "admin-1-credential",
      password: "hashed-password",
      providerId: "credential",
      userId: "admin-1",
    })
  })

  it("seed한 계정은 통합 API 관리자 인증으로 로그인할 수 있다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })
      const auth = createTestAdminAuth(database.db)
      expect(await requestAdminEmailSignIn(auth, "admin-password-123")).toBe(
        200
      )
    } finally {
      database.close()
    }
  }, 20_000)

  it("resetPassword가 true일 때만 기존 credential을 갱신한다", async () => {
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
      const auth = createTestAdminAuth(database.db)
      expect(await requestAdminEmailSignIn(auth, "admin-password-123")).toBe(
        200
      )
      expect(
        await requestAdminEmailSignIn(auth, "changed-password-123")
      ).not.toBe(200)

      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-16T00:00:00.000Z"),
        password: "changed-password-123",
        resetPassword: true,
      })
      expect(await requestAdminEmailSignIn(auth, "changed-password-123")).toBe(
        200
      )
    } finally {
      database.close()
    }
  }, 20_000)

  it("credential 저장 실패 시 같은 transaction의 user 저장도 rollback한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      database.sqlite.exec(`
        CREATE TRIGGER reject_admin_account_insert
        BEFORE INSERT ON admin_account
        BEGIN SELECT RAISE(ABORT, 'fault injection'); END;
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
  auth: AdminAuthRuntime,
  password: string
): Promise<number> {
  return auth
    .authHandler(
      new Request("http://api.localhost:4000/api/admin/auth/sign-in/email", {
        body: JSON.stringify({ email: "admin@example.com", password }),
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3001",
        },
        method: "POST",
      })
    )
    .then((response) => response.status)
}

function createTestAdminAuth(database: WritingAppDatabase): AdminAuthRuntime {
  return createAdminAuthRuntime({
    apiOrigin: "http://api.localhost:4000",
    database: createAdminAuthDatabase(database),
    secret: "x".repeat(32),
    sessionRevoker: createDrizzleAdminSessionRevoker(database),
    webOrigin: "http://localhost:3001",
  })
}
