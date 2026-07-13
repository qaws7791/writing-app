import { describe, expect, it, vi } from "vitest"

import {
  createAdminAuth,
  createAdminAuthHandler,
  createAdminSessionResolver,
} from "@/auth/admin-auth"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import { seedAdminUser } from "@/scripts/seed-admin"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
} from "@workspace/db"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { adminRoles } from "@workspace/core/admin"

describe("Admin Better Auth session resolver", () => {
  it("owner는 비밀번호 로그인만으로 관리자 세션을 발급받는다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "owner@example.com",
        name: "소유자",
        now: new Date(),
        password: "Owner-password-123!",
      })
      const login = await postAuth(
        createTestAuth(database),
        "/api/auth/sign-in/email",
        { email: "owner@example.com", password: "Owner-password-123!" }
      )

      expect(login.ok).toBe(true)
      expect(login.headers.get("set-cookie")).toContain("admin_session_token=")
      await expect(login.json()).resolves.not.toMatchObject({
        twoFactorRedirect: true,
      })
    } finally {
      database.close()
    }
  })

  it("비밀번호 변경 성공 시 Better Auth가 만든 새 세션까지 모두 폐기한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "owner@example.com",
        name: "소유자",
        now: new Date(),
        password: "Owner-password-123!",
      })
      const auth = createTestAuth(database)
      const firstLogin = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      const secondLogin = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      const response = await createAdminAuthHandler({ auth, database })(
        createAuthRequest(
          "/api/auth/change-password",
          {
            currentPassword: "Owner-password-123!",
            newPassword: "New-owner-password-123!",
            revokeOtherSessions: true,
          },
          readSetCookiePair(firstLogin)
        )
      )

      expect(response.ok).toBe(true)
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
      await expect(
        database.db.select().from(adminAuthSessions)
      ).resolves.toEqual([])
      await expect(
        createAdminSessionResolver(auth).resolveSession(
          new Headers({ Cookie: readSetCookiePair(secondLogin) })
        )
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it.each([
    ["일반 가입 본문", {}],
    ["owner role을 포함한 본문", { role: adminRoles.owner }],
  ])(
    "관리자 email/password %s을 거부하고 인증 row를 만들지 않는다",
    async (_, extraBody) => {
      const database = createInMemoryWritingAppDatabase()
      try {
        runBaselineMigration(database.sqlite)
        const response = await createTestAuth(database).handler(
          createAuthRequest("/api/auth/sign-up/email", {
            email: "admin@example.com",
            name: "관리자",
            password: "admin-password-123",
            ...extraBody,
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
      const response = await createTestAuth(database).handler(
        createAuthRequest("/api/auth/sign-in/social", { provider: "google" })
      )
      expect(response.ok).toBe(false)
    } finally {
      database.close()
    }
  })

  it("Better Auth getSession 결과를 관리자 세션으로 변환한다", async () => {
    const headers = new Headers({
      Cookie: "admin_session_token=admin-token-1.signature",
    })
    const getSession = vi.fn(async () => ({
      session: {
        createdAt: new Date("2026-07-12T23:58:00.000Z"),
        expiresAt: new Date("2026-07-13T00:00:00.000Z"),
      },
      user: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: adminRoles.owner,
      },
    }))

    await expect(
      createAdminSessionResolver({ api: { getSession } }).resolveSession(
        headers
      )
    ).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: adminRoles.owner,
      },
      [adminSessionExpiresAt]: new Date("2026-07-13T00:00:00.000Z"),
    })
    expect(getSession).toHaveBeenCalledWith({ headers })
  })
})

function createTestAuth(
  database: ReturnType<typeof createInMemoryWritingAppDatabase>
) {
  return createAdminAuth({
    authBaseUrl: "http://localhost:4001",
    db: database.db,
    secret: "x".repeat(32),
    webOrigin: "http://localhost:3001",
  })
}

async function postAuth(
  auth: ReturnType<typeof createAdminAuth>,
  path: string,
  body: Readonly<Record<string, unknown>>,
  cookie?: string
): Promise<Response> {
  return auth.handler(createAuthRequest(path, body, cookie))
}

function createAuthRequest(
  path: string,
  body: Readonly<Record<string, unknown>>,
  cookie?: string
): Request {
  return new Request(`http://localhost:4001${path}`, {
    body: JSON.stringify(body),
    headers: {
      ...(cookie === undefined ? {} : { Cookie: cookie }),
      "Content-Type": "application/json",
      Origin: "http://localhost:3001",
    },
    method: "POST",
  })
}

function readSetCookiePair(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? ""
  return setCookie
    .split(/,(?=\s*[^;,]+=)/u)
    .map((value) => value.trim().split(";")[0])
    .filter(Boolean)
    .join("; ")
}
