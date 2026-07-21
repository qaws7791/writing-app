import { beforeEach, describe, expect, it, vi } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminRoles } from "@workspace/core/admin"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  adminAuthVerifications,
} from "@workspace/db/schema"

import {
  adminSessionExpiresAt,
  createAdminAuthRuntime,
} from "#auth/admin/server"
import { createSqliteAuthDatabaseAdapter } from "#auth/sqlite-database"

const authMocks = vi.hoisted(() => ({
  betterAuth: vi.fn(),
  getSession: vi.fn(),
  handler: vi.fn(async () => new Response(null)),
}))

vi.mock("better-auth", () => ({
  betterAuth: authMocks.betterAuth,
}))

describe("관리자 Better Auth runtime", () => {
  beforeEach(() => {
    authMocks.betterAuth.mockReset()
    authMocks.getSession.mockReset()
    authMocks.handler.mockClear()
    authMocks.betterAuth.mockReturnValue({
      api: { getSession: authMocks.getSession },
      handler: authMocks.handler,
    })
  })

  it("관리자 URL, origin, cookie, table model과 가입 차단을 보존한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createAdminAuthRuntime({
        apiOrigin: "https://admin-api.example.test",
        cookieDomain: "example.test",
        database: createTestDatabaseAdapter(database.db),
        secret: "x".repeat(32),
        sessionRevoker: { revokeAllForAdmin: vi.fn() },
        webOrigin: "https://admin.example.test",
      })

      expect(authMocks.betterAuth.mock.calls.at(0)?.at(0)).toMatchObject({
        account: { modelName: "admin_account" },
        advanced: {
          cookiePrefix: "writing-app-admin",
          cookies: {
            session_token: { name: adminSessionCookieName },
          },
          crossSubDomainCookies: {
            domain: "example.test",
            enabled: true,
          },
        },
        basePath: "/api/admin/auth",
        baseURL: "https://admin-api.example.test",
        disabledPaths: ["/sign-up/email"],
        emailAndPassword: { disableSignUp: true, enabled: true },
        session: { modelName: "admin_session" },
        trustedOrigins: ["https://admin.example.test"],
        user: { modelName: "admin_user" },
        verification: { modelName: "admin_verification" },
      })
    } finally {
      database.close()
    }
  })

  it("Better Auth session을 관리자 session으로 변환한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const expiresAt = new Date("2026-07-18T00:00:00.000Z")
    authMocks.getSession.mockResolvedValue({
      session: { expiresAt },
      user: {
        email: "owner@example.com",
        id: "admin-1",
        name: "소유자",
        role: adminRoles.owner,
      },
    })

    try {
      const runtime = createAdminAuthRuntime({
        apiOrigin: "https://admin-api.example.test",
        database: createTestDatabaseAdapter(database.db),
        secret: "x".repeat(32),
        sessionRevoker: { revokeAllForAdmin: vi.fn() },
        webOrigin: "https://admin.example.test",
      })

      await expect(
        runtime.sessionResolver.resolveSession(new Headers())
      ).resolves.toEqual({
        admin: {
          email: "owner@example.com",
          id: "admin-1",
          name: "소유자",
          role: adminRoles.owner,
        },
        [adminSessionExpiresAt]: expiresAt,
      })
    } finally {
      database.close()
    }
  })

  it("잘못된 관리자 id, role과 누락 session을 인증으로 승격하지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      const runtime = createAdminAuthRuntime({
        apiOrigin: "https://admin-api.example.test",
        database: createTestDatabaseAdapter(database.db),
        secret: "x".repeat(32),
        sessionRevoker: { revokeAllForAdmin: vi.fn() },
        webOrigin: "https://admin.example.test",
      })

      authMocks.getSession.mockResolvedValueOnce({
        session: { expiresAt: new Date() },
        user: {
          email: "admin@example.com",
          id: "",
          name: "관리자",
          role: adminRoles.owner,
        },
      })
      await expect(
        runtime.sessionResolver.resolveSession(new Headers())
      ).resolves.toBeNull()

      authMocks.getSession.mockResolvedValueOnce({
        session: { expiresAt: new Date() },
        user: {
          email: "admin@example.com",
          id: "admin-1",
          name: "관리자",
          role: "learner",
        },
      })
      await expect(
        runtime.sessionResolver.resolveSession(new Headers())
      ).resolves.toBeNull()

      authMocks.getSession.mockResolvedValueOnce(null)
      await expect(
        runtime.sessionResolver.resolveSession(new Headers())
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })
})

function createTestDatabaseAdapter(
  database: ReturnType<typeof createInMemoryWritingAppDatabase>["db"]
) {
  return createSqliteAuthDatabaseAdapter({
    database,
    schema: {
      admin_account: adminAuthAccounts,
      admin_session: adminAuthSessions,
      admin_user: adminAuthUsers,
      admin_verification: adminAuthVerifications,
    },
  })
}
