import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  authAccounts,
  authRateLimits,
  authSessions,
  authUsers,
  authVerifications,
} from "#auth/schema/index"

import { createLearnerAuthRuntime } from "#auth/learner/server"
import { createSqliteAuthDatabaseAdapter } from "#auth/sqlite-database"
import {
  createAuthTestDatabase,
  type AuthTestDatabase,
} from "#auth/test-support/auth-test-database"

const authBaseUrl = "http://localhost:4000"
const webOrigin = "http://localhost:3000"

describe("학습자 테스트 인증", () => {
  it("Google 계정과 같은 학습자 session cookie를 발급한다", async () => {
    const database = createMigratedTestDatabase()

    try {
      const runtime = createTestRuntime(database.db)
      const response = await runtime.authHandler(
        new Request(
          `${authBaseUrl}/api/auth/test/sign-in?callbackURL=${encodeURIComponent(
            `${webOrigin}/app/courses`
          )}`,
          { headers: { Origin: webOrigin } }
        )
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("location")).toBe(`${webOrigin}/app/courses`)

      const cookieHeader = readCookieHeader(response)
      expect(cookieHeader).toContain(`${learnerSessionCookieName}=`)
      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: cookieHeader })
        )
      ).resolves.toMatchObject({
        email: "learner@example.com",
        id: "user-1",
        name: "글쓰기 탐험가",
      })
      expect(
        database.db
          .select({ providerId: authAccounts.providerId })
          .from(authAccounts)
          .where(eq(authAccounts.userId, "user-1"))
          .all()
      ).toEqual([{ providerId: "google" }])
      expect(
        database.db
          .select({ userId: authSessions.userId })
          .from(authSessions)
          .where(eq(authSessions.userId, "user-1"))
          .all()
      ).toHaveLength(1)
    } finally {
      database.close()
    }
  })

  it("기존 테스트 사용자 이름을 주입된 persistence port로 동기화한다", async () => {
    const database = createMigratedTestDatabase()

    try {
      database.db
        .insert(authUsers)
        .values({
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          email: "learner@example.com",
          emailVerified: true,
          id: "user-1",
          image: null,
          name: "학습자",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        })
        .run()
      const runtime = createTestRuntime(database.db)
      const response = await runtime.authHandler(
        new Request(`${authBaseUrl}/api/auth/test/sign-in`, {
          headers: { Origin: webOrigin },
        })
      )

      await expect(
        runtime.identityResolver.resolveIdentity(
          new Headers({ Cookie: readCookieHeader(response) })
        )
      ).resolves.toMatchObject({ name: "글쓰기 탐험가" })
      expect(
        database.db
          .select({ name: authUsers.name })
          .from(authUsers)
          .where(eq(authUsers.id, "user-1"))
          .get()
      ).toEqual({ name: "글쓰기 탐험가" })
    } finally {
      database.close()
    }
  })

  it("외부 callback을 거절하고 HTTPS cookie 보안 속성을 유지한다", async () => {
    const database = createMigratedTestDatabase()
    const secureWebOrigin = "https://app.example.test"

    try {
      const runtime = createTestRuntime(database.db, secureWebOrigin)
      const response = await runtime.authHandler(
        new Request(
          `${secureWebOrigin}/api/auth/test/sign-in?callbackURL=${encodeURIComponent(
            "https://external.example/app/courses"
          )}`,
          { headers: { Origin: secureWebOrigin } }
        )
      )
      const setCookie = response.headers.get("set-cookie") ?? ""

      expect(response.headers.get("location")).toBe(`${secureWebOrigin}/app`)
      expect(setCookie).toContain(`${learnerSessionCookieName}=`)
      expect(setCookie).toMatch(/;\s*Secure/iu)
      expect(setCookie).toMatch(/;\s*HttpOnly/iu)
      expect(setCookie).toMatch(/;\s*SameSite=Lax/iu)
    } finally {
      database.close()
    }
  })
})

type Database = AuthTestDatabase

function createMigratedTestDatabase() {
  return createAuthTestDatabase()
}

function createTestRuntime(database: Database, runtimeWebOrigin = webOrigin) {
  return createLearnerAuthRuntime({
    database: createSqliteAuthDatabaseAdapter({
      database,
      schema: {
        account: authAccounts,
        rateLimit: authRateLimits,
        session: authSessions,
        user: authUsers,
        verification: authVerifications,
      },
    }),
    identityProvisioner: { async provision() {} },
    secret: "x".repeat(32),
    testAuth: {
      kind: "enabled",
      synchronizeDisplayName(input) {
        database
          .update(authUsers)
          .set({ name: input.displayName, updatedAt: input.updatedAt })
          .where(eq(authUsers.id, input.userId))
          .run()
      },
    },
    webOrigin: runtimeWebOrigin,
  })
}

function readCookieHeader(response: Response): string {
  const setCookie = response.headers.get("set-cookie")
  expect(setCookie).not.toBeNull()

  return (
    setCookie
      ?.split(/,(?=\s*[^;,\s]+=)/u)
      .map((cookie) => cookie.split(";")[0])
      .join("; ") ?? ""
  )
}
