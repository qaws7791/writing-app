import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  authSessions,
  authUsers,
} from "#auth/schema/index"

import { createAdminAuthRuntime } from "#auth/admin/server"
import { hashAuthPassword } from "#auth/password"
import {
  createAdminAuthDatabaseAdapter,
  createAuthTestDatabase,
  readSetCookiePair,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

const ownerPassword = "Owner-password-123!"

describe("관리자 인증 통합", () => {
  it("비밀번호 로그인은 관리자 cookie와 관리자 table만 사용한다", async () => {
    const database = createAuthTestDatabase()

    try {
      await seedOwner(database.db)
      const runtime = createTestRuntime(database.db)
      const response = await postAuth(
        runtime.authHandler,
        "/api/admin/auth/sign-in/email",
        { email: "owner@example.com", password: ownerPassword }
      )

      expect(response.ok).toBe(true)
      expect(response.headers.get("set-cookie")).toContain(
        "admin_session_token="
      )
      expect(response.headers.get("set-cookie")).not.toContain(
        "learner_session_token="
      )
      expect(database.db.select().from(adminAuthUsers).all()).toHaveLength(1)
      expect(database.db.select().from(adminAuthSessions).all()).toHaveLength(1)
      expect(database.db.select().from(authUsers).all()).toEqual([])
      expect(database.db.select().from(authSessions).all()).toEqual([])
    } finally {
      database.close()
    }
  })

  it("관리자 sign-up을 거부한다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createTestRuntime(database.db)
      const response = await postAuth(
        runtime.authHandler,
        "/api/admin/auth/sign-up/email",
        {
          email: "new-admin@example.com",
          name: "새 관리자",
          password: "Admin-password-123!",
        }
      )

      expect(response.status).toBe(404)
      expect(database.db.select().from(adminAuthUsers).all()).toEqual([])
      expect(database.db.select().from(adminAuthAccounts).all()).toEqual([])
    } finally {
      database.close()
    }
  })

  it("비밀번호 변경 성공 시 관리자 session만 모두 폐기한다", async () => {
    const database = createAuthTestDatabase()

    try {
      await seedOwner(database.db)
      const runtime = createTestRuntime(database.db)
      const firstLogin = await postAuth(
        runtime.authHandler,
        "/api/admin/auth/sign-in/email",
        { email: "owner@example.com", password: ownerPassword }
      )
      await postAuth(runtime.authHandler, "/api/admin/auth/sign-in/email", {
        email: "owner@example.com",
        password: ownerPassword,
      })

      const response = await runtime.authHandler(
        createAuthRequest(
          "/api/admin/auth/change-password",
          {
            currentPassword: ownerPassword,
            newPassword: "New-owner-password-123!",
            revokeOtherSessions: true,
          },
          { cookie: readSetCookiePair(firstLogin) }
        )
      )

      expect(response.ok).toBe(true)
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
      expect(database.db.select().from(adminAuthSessions).all()).toEqual([])
      expect(database.db.select().from(authSessions).all()).toEqual([])
    } finally {
      database.close()
    }
  })
})

function createTestRuntime(database: AuthTestDatabase) {
  return createAdminAuthRuntime({
    database: createAdminAuthDatabaseAdapter(database),
    secret: "admin-test-secret-0123456789abcdef",
    sessionRevoker: {
      revokeAllForAdmin(adminId) {
        database
          .delete(adminAuthSessions)
          .where(eq(adminAuthSessions.userId, adminId))
          .run()
      },
    },
    webOrigin: "http://localhost:3001",
  })
}

async function seedOwner(database: AuthTestDatabase): Promise<void> {
  const now = new Date("2026-07-18T00:00:00.000Z")
  const password = await hashAuthPassword(ownerPassword)

  database
    .insert(adminAuthUsers)
    .values({
      createdAt: now,
      email: "owner@example.com",
      emailVerified: true,
      id: "admin-1",
      image: null,
      name: "소유자",
      updatedAt: now,
    })
    .run()
  database
    .insert(adminAuthAccounts)
    .values({
      accountId: "admin-1",
      createdAt: now,
      id: "admin-1-credential",
      password,
      providerId: "credential",
      updatedAt: now,
      userId: "admin-1",
    })
    .run()
}

async function postAuth(
  authHandler: (request: Request) => Promise<Response>,
  path: string,
  body: Readonly<object>
): Promise<Response> {
  return authHandler(createAuthRequest(path, body))
}

function createAuthRequest(
  path: string,
  body: Readonly<object>,
  options: { readonly cookie?: string; readonly origin?: string } = {}
): Request {
  return new Request(`http://api.localhost:4000${path}`, {
    body: JSON.stringify(body),
    headers: {
      ...(options.cookie === undefined ? {} : { Cookie: options.cookie }),
      "Content-Type": "application/json",
      Origin: options.origin ?? "http://localhost:3001",
    },
    method: "POST",
  })
}
