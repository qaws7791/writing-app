import { describe, expect, it, vi } from "vitest"
import { hashPassword } from "better-auth/crypto"
import { adminRoles } from "@workspace/core/admin"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  authSessions,
  authUsers,
} from "@workspace/db"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import {
  createAdminAuth,
  createAdminAuthHandler,
  createAdminSessionRevoker,
  createAdminSessionResolver,
} from "@/adapters/auth/admin-auth"
import { adminSessionExpiresAt } from "@/adapters/auth/admin-session"

describe("통합 API 관리자 인증 adapter", () => {
  it("관리자 비밀번호 로그인은 관리자 cookie와 관리자 table만 사용한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedOwner(database.db)
      const response = await postAuth(
        createTestAuth(database.db),
        "/api/admin/auth/sign-in/email",
        {
          email: "owner@example.com",
          password: "Owner-password-123!",
        }
      )

      expect(response.ok).toBe(true)
      expect(response.headers.get("set-cookie")).toContain(
        "admin_session_token="
      )
      expect(response.headers.get("set-cookie")).not.toContain(
        "learner_session_token="
      )
      await expect(
        database.db.select().from(adminAuthUsers)
      ).resolves.toHaveLength(1)
      await expect(
        database.db.select().from(adminAuthSessions)
      ).resolves.toHaveLength(1)
      await expect(database.db.select().from(authUsers)).resolves.toEqual([])
      await expect(database.db.select().from(authSessions)).resolves.toEqual([])
    } finally {
      database.close()
    }
  })

  it("관리자 sign-up을 거부한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      const auth = createTestAuth(database.db)
      const signUp = await postAuth(auth, "/api/admin/auth/sign-up/email", {
        email: "new-admin@example.com",
        name: "새 관리자",
        password: "Admin-password-123!",
      })
      expect([403, 404]).toContain(signUp.status)
      await expect(database.db.select().from(adminAuthUsers)).resolves.toEqual(
        []
      )
      await expect(
        database.db.select().from(adminAuthAccounts)
      ).resolves.toEqual([])
    } finally {
      database.close()
    }
  })

  it("비밀번호 변경 성공 시 관리자 세션만 모두 폐기한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedOwner(database.db)
      const auth = createTestAuth(database.db)
      const firstLogin = await postAuth(auth, "/api/admin/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      await postAuth(auth, "/api/admin/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })

      const response = await createAdminAuthHandler({
        auth,
        sessionRevoker: createAdminSessionRevoker(database.db),
      })(
        createAuthRequest(
          "/api/admin/auth/change-password",
          {
            currentPassword: "Owner-password-123!",
            newPassword: "New-owner-password-123!",
            revokeOtherSessions: true,
          },
          { cookie: readSetCookiePair(firstLogin) }
        )
      )

      expect(response.ok).toBe(true)
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
      await expect(
        database.db.select().from(adminAuthSessions)
      ).resolves.toEqual([])
      await expect(database.db.select().from(authSessions)).resolves.toEqual([])
    } finally {
      database.close()
    }
  })

  it("Better Auth session을 app-local 관리자 session으로 변환한다", async () => {
    const headers = new Headers({
      Cookie: "admin_session_token=admin-token.signature",
    })
    const getSession = vi.fn(async () => ({
      session: { expiresAt: new Date("2026-07-18T00:00:00.000Z") },
      user: {
        email: "owner@example.com",
        id: "admin-1",
        name: "소유자",
        role: adminRoles.owner,
      },
    }))

    await expect(
      createAdminSessionResolver({ api: { getSession } }).resolveSession(
        headers
      )
    ).resolves.toEqual({
      admin: {
        email: "owner@example.com",
        id: "admin-1",
        name: "소유자",
        role: adminRoles.owner,
      },
      [adminSessionExpiresAt]: new Date("2026-07-18T00:00:00.000Z"),
    })
    expect(getSession).toHaveBeenCalledWith({ headers })
  })

  it("잘못된 관리자 id 또는 role은 인증 session으로 승격하지 않는다", async () => {
    const resolve = (user: { readonly id: string; readonly role: unknown }) =>
      createAdminSessionResolver({
        api: {
          async getSession() {
            return {
              session: { expiresAt: new Date() },
              user: {
                email: "admin@example.com",
                name: "관리자",
                ...user,
              },
            }
          },
        },
      }).resolveSession(new Headers())

    await expect(
      resolve({ id: "", role: adminRoles.owner })
    ).resolves.toBeNull()
    await expect(
      resolve({ id: "admin-1", role: "learner" })
    ).resolves.toBeNull()
  })
})

type Database = ReturnType<typeof createInMemoryWritingAppDatabase>["db"]

function createTestAuth(database: Database) {
  return createAdminAuth({
    apiOrigin: "http://api.localhost:4000",
    db: database,
    secret: "admin-test-secret-0123456789abcdef",
    webOrigin: "http://localhost:3001",
  })
}

async function seedOwner(database: Database): Promise<void> {
  const now = new Date("2026-07-18T00:00:00.000Z")
  const password = await hashPassword("Owner-password-123!")

  database
    .insert(adminAuthUsers)
    .values({
      createdAt: now,
      email: "owner@example.com",
      emailVerified: true,
      id: "admin-1",
      image: null,
      name: "소유자",
      role: adminRoles.owner,
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
  auth: ReturnType<typeof createAdminAuth>,
  path: string,
  body: Readonly<Record<string, unknown>>
): Promise<Response> {
  return auth.handler(createAuthRequest(path, body))
}

function createAuthRequest(
  path: string,
  body: Readonly<Record<string, unknown>>,
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

function readSetCookiePair(response: Response): string {
  return (response.headers.get("set-cookie") ?? "")
    .split(/,(?=\s*[^;,]+=)/u)
    .map((value) => value.trim().split(";")[0])
    .filter(Boolean)
    .join("; ")
}
