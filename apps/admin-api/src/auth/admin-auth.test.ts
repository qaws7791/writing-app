import { describe, expect, it, vi } from "vitest"

import { createAdminAuth, createAdminSessionResolver } from "@/auth/admin-auth"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import { adminRoles } from "@workspace/core/admin"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
} from "@workspace/db/schema"

const adminSession = {
  createdAt: new Date("2026-06-15T09:00:00.000Z"),
  email: "admin@example.com",
  id: "admin-1",
  image: null,
  name: "관리자",
  role: adminRoles.owner,
  updatedAt: new Date("2026-06-15T09:00:00.000Z"),
}

describe("Admin Better Auth session resolver", () => {
  it.each([
    ["일반 가입 본문", {}],
    ["owner role을 포함한 본문", { role: adminRoles.owner }],
  ])(
    "관리자 email/password %s을 거부하고 인증 row를 만들지 않는다",
    async (_, extraBody) => {
      const database = createInMemoryWritingAppDatabase()

      try {
        runBaselineMigration(database.sqlite)
        const auth = createAdminAuth({
          authBaseUrl: "http://localhost:4001",
          db: database.db,
          secret: "x".repeat(32),
          webOrigin: "http://localhost:3001",
        })
        const response = await auth.handler(
          new Request("http://localhost:4001/api/auth/sign-up/email", {
            body: JSON.stringify({
              email: "admin@example.com",
              name: "관리자",
              password: "admin-password-123",
              ...extraBody,
            }),
            headers: {
              "Content-Type": "application/json",
              Origin: "http://localhost:3001",
            },
            method: "POST",
          })
        )

        expect([403, 404]).toContain(response.status)
        await expect(
          database.db.select().from(adminAuthUsers)
        ).resolves.toEqual([])
        await expect(
          database.db.select().from(adminAuthAccounts)
        ).resolves.toEqual([])
        await expect(
          database.db.select().from(adminAuthSessions)
        ).resolves.toEqual([])
      } finally {
        database.close()
      }
    }
  )

  it("관리자 인증은 Google social sign-in을 열지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      const auth = createAdminAuth({
        authBaseUrl: "http://localhost:4001",
        db: database.db,
        secret: "x".repeat(32),
        webOrigin: "http://localhost:3001",
      })
      const response = await auth.handler(
        new Request("http://localhost:4001/api/auth/sign-in/social", {
          body: JSON.stringify({
            provider: "google",
          }),
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3001",
          },
          method: "POST",
        })
      )

      expect(response.ok).toBe(false)
    } finally {
      database.close()
    }
  })

  it("Better Auth getSession 결과를 관리자 세션으로 변환한다", async () => {
    const getSession = vi.fn(async () => ({
      session: {
        expiresAt: new Date("2026-07-13T00:00:00.000Z"),
      },
      user: adminSession,
    }))
    const resolver = createAdminSessionResolver({
      api: {
        getSession,
      },
    })
    const headers = new Headers({
      Cookie: "admin_session_token=admin-token-1.signature",
    })

    await expect(resolver.resolveSession(headers)).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: adminRoles.owner,
      },
      [adminSessionExpiresAt]: new Date("2026-07-13T00:00:00.000Z"),
    })
    expect(getSession).toHaveBeenCalledWith({
      headers,
    })
  })

  it("Better Auth 세션이 없으면 관리자 세션도 없다", async () => {
    const resolver = createAdminSessionResolver({
      api: {
        getSession: vi.fn(async () => null),
      },
    })

    await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
  })
})
