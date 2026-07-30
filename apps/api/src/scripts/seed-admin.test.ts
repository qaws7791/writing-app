import { describe, expect, it } from "vitest"
import {
  createAdminAuthRuntime,
  type AdminAuthRuntime,
} from "@workspace/auth/admin/server"
import { adminAuthUsers } from "@workspace/auth/schema"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"

import { createAdminAuthDatabase } from "@/adapters/auth/auth-sqlite-database"
import { createDrizzleAdminSessionRevoker } from "@/adapters/auth/admin-session-revoker"
import { runApplicationMigrations } from "@/db/migrate"
import { parseSeedAdminEnvironment, seedAdminUser } from "@/scripts/seed-admin"

describe("통합 API 관리자 seed", () => {
  it.each([
    ["ADMIN_SEED_EMAIL", { ADMIN_SEED_PASSWORD: "Strong-admin-123!" }],
    ["ADMIN_SEED_PASSWORD", { ADMIN_SEED_EMAIL: "owner@example.com" }],
    [
      "placeholder",
      {
        ADMIN_SEED_EMAIL: "owner@example.com",
        ADMIN_SEED_PASSWORD: "replace-with-local-admin-password",
      },
    ],
    [
      "문자 종류",
      {
        ADMIN_SEED_EMAIL: "owner@example.com",
        ADMIN_SEED_PASSWORD: "aaaaaaaaaaaaaaaa",
      },
    ],
  ] as const)(
    "안전하지 않은 credential을 DB를 열기 전에 %s 오류로 거절한다",
    (message, environment) => {
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

  it("seed는 관리자 auth user와 credential을 함께 만든다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })

      await expect(database.db.select().from(adminAuthUsers)).resolves.toEqual([
        expect.objectContaining({ email: "admin@example.com" }),
      ])
      expect(readSeedAdminState(database)).toMatchObject({
        email: "admin@example.com",
        name: "관리자",
      })
    } finally {
      database.close()
    }
  }, 10_000)

  it("resetPassword가 true일 때만 기존 credential을 갱신한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })
      database.sqlite.exec(`
        UPDATE admin_user
        SET email = 'edited-admin@example.com', name = '수정한 관리자', updated_at = 7
        WHERE id = 'admin-1';
      `)
      const before = readSeedAdminState(database)
      await seedAdminUser(database.db, {
        email: "replacement@example.com",
        name: "교체하면 안 되는 관리자",
        now: new Date("2026-06-15T00:00:00.000Z"),
        password: "changed-password-123",
      })
      expect(readSeedAdminState(database)).toEqual(before)
      const auth = createTestAdminAuth(database.db)
      expect(
        await requestAdminEmailSignIn(
          auth,
          "admin-password-123",
          "edited-admin@example.com"
        )
      ).toBe(200)
      expect(
        await requestAdminEmailSignIn(
          auth,
          "changed-password-123",
          "edited-admin@example.com"
        )
      ).not.toBe(200)

      await seedAdminUser(database.db, {
        email: "replacement@example.com",
        name: "교체하면 안 되는 관리자",
        now: new Date("2026-06-16T00:00:00.000Z"),
        password: "changed-password-123",
        resetPassword: true,
      })
      expect(readSeedAdminState(database)).toMatchObject({
        email: before.email,
        name: before.name,
      })
      expect(
        await requestAdminEmailSignIn(
          auth,
          "changed-password-123",
          "edited-admin@example.com"
        )
      ).toBe(200)
    } finally {
      database.close()
    }
  }, 15_000)

  it("부분 seed 상태는 자동 보정하지 않고 실패한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(database.sqlite)
      await seedAdminUser(database.db, {
        email: "admin@example.com",
        name: "관리자",
        now: new Date("2026-06-14T00:00:00.000Z"),
        password: "admin-password-123",
      })
      database.sqlite.exec(`
        DELETE FROM admin_account
        WHERE user_id = 'admin-1';
      `)

      await expect(
        seedAdminUser(database.db, {
          email: "admin@example.com",
          name: "관리자",
          now: new Date("2026-06-15T00:00:00.000Z"),
          password: "admin-password-123",
        })
      ).rejects.toThrow("불완전하거나 credential")
      expect(
        database.sqlite
          .query<{ readonly email: string }, []>(
            "SELECT email FROM admin_user WHERE id = 'admin-1'"
          )
          .get()?.email
      ).toBe("admin@example.com")
    } finally {
      database.close()
    }
  })

  it("credential 저장 실패 시 같은 transaction의 user 저장도 rollback한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(database.sqlite)
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
  password: string,
  email = "admin@example.com"
): Promise<number> {
  return auth
    .authHandler(
      new Request("http://api.localhost:4000/api/admin/auth/sign-in/email", {
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3001",
        },
        method: "POST",
      })
    )
    .then((response) => response.status)
}

function readSeedAdminState(database: WritingAppDatabaseClient): {
  readonly email: string
  readonly name: string
  readonly password: string | null
} {
  const state = database.sqlite
    .query<
      {
        readonly email: string
        readonly name: string
        readonly password: string | null
      },
      []
    >(`
      SELECT
        admin_user.email,
        admin_user.name,
        admin_account.password
      FROM admin_user
      INNER JOIN admin_account ON admin_account.user_id = admin_user.id
      WHERE admin_user.id = 'admin-1'
    `)
    .get()
  if (state === null) throw new Error("seed admin fixture가 필요합니다.")
  return state
}

function createTestAdminAuth(database: WritingAppDatabase): AdminAuthRuntime {
  return createAdminAuthRuntime({
    database: createAdminAuthDatabase(database),
    secret: "x".repeat(32),
    sessionRevoker: createDrizzleAdminSessionRevoker(database),
    webOrigin: "http://localhost:3001",
  })
}
