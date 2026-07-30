import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAdminAuthRuntime } from "#auth/admin/server"
import {
  createAdminAuthDatabaseAdapter,
  createAuthTestDatabase,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

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

  it("Better Auth session을 관리자 session으로 변환한다", async () => {
    const database = createAuthTestDatabase()
    const expiresAt = new Date("2026-07-18T00:00:00.000Z")
    authMocks.getSession.mockResolvedValue({
      session: { expiresAt },
      user: {
        email: "owner@example.com",
        id: "admin-1",
        name: "소유자",
      },
    })

    try {
      const runtime = createTestAdminRuntime(database.db)

      await expect(
        runtime.identityResolver.resolveIdentity(new Headers())
      ).resolves.toEqual({
        email: "owner@example.com",
        expiresAt,
        id: "admin-1",
        name: "소유자",
      })
    } finally {
      database.close()
    }
  })

  it("빈 관리자 id를 인증 identity로 승격하지 않는다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createTestAdminRuntime(database.db)
      authMocks.getSession.mockResolvedValue({
        session: { expiresAt: new Date() },
        user: { email: "admin@example.com", id: "", name: "관리자" },
      })

      await expect(
        runtime.identityResolver.resolveIdentity(new Headers())
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it("session이 없으면 인증 identity 부재로 반환한다", async () => {
    const database = createAuthTestDatabase()

    try {
      const runtime = createTestAdminRuntime(database.db)
      authMocks.getSession.mockResolvedValue(null)

      await expect(
        runtime.identityResolver.resolveIdentity(new Headers())
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })
})

function createTestAdminRuntime(database: AuthTestDatabase) {
  return createAdminAuthRuntime({
    database: createAdminAuthDatabaseAdapter(database),
    secret: "x".repeat(32),
    sessionRevoker: { revokeAllForAdmin: vi.fn() },
    webOrigin: "https://admin.example.test",
  })
}
