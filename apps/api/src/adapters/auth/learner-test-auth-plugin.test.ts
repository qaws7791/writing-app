import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import type { LearnerProfileRepository } from "@workspace/core/auth"

import { createLearnerAuth } from "@/adapters/auth/learner-auth"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { authAccounts, authSessions, authUsers } from "@workspace/db/schema"

const authBaseUrl = "http://localhost:4000"
const webOrigin = "http://localhost:3000"

describe("학습자 테스트 인증", () => {
  it("테스트 로그인 endpoint가 Google 계정과 같은 학습자 세션 쿠키를 발급한다", async () => {
    const database = createMigratedTestDatabase()

    try {
      const auth = createLearnerAuth({
        authBaseUrl,
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret: "x".repeat(32),
        testAuthEnabled: true,
        webOrigin,
      })
      const response = await auth.handler(
        new Request(
          `${authBaseUrl}/api/auth/test/sign-in?callbackURL=${encodeURIComponent(
            `${webOrigin}/app/courses`
          )}`,
          {
            headers: {
              Origin: webOrigin,
            },
          }
        )
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("location")).toBe(`${webOrigin}/app/courses`)

      const cookieHeader = readCookieHeader(response)
      expect(cookieHeader).toContain("learner_session_token=")

      await expect(
        auth.api.getSession({
          headers: new Headers({
            Cookie: cookieHeader,
          }),
        })
      ).resolves.toMatchObject({
        user: {
          email: "learner@example.com",
          id: "user-1",
          name: "글쓰기 탐험가",
        },
      })
      expect(
        database.db
          .select({ email: authUsers.email, id: authUsers.id })
          .from(authUsers)
          .where(eq(authUsers.id, "user-1"))
          .all()
      ).toEqual([
        {
          email: "learner@example.com",
          id: "user-1",
        },
      ])
      expect(
        database.db
          .select({
            accountId: authAccounts.accountId,
            providerId: authAccounts.providerId,
            userId: authAccounts.userId,
          })
          .from(authAccounts)
          .where(eq(authAccounts.userId, "user-1"))
          .all()
      ).toEqual([
        {
          accountId: "test-google-user-1",
          providerId: "google",
          userId: "user-1",
        },
      ])
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

  it("기존 테스트 사용자 이름이 다르면 기본 표시명으로 동기화한다", async () => {
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

      const auth = createLearnerAuth({
        authBaseUrl,
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret: "x".repeat(32),
        testAuthEnabled: true,
        webOrigin,
      })
      const response = await auth.handler(
        new Request(`${authBaseUrl}/api/auth/test/sign-in`, {
          headers: {
            Origin: webOrigin,
          },
        })
      )

      expect(response.status).toBe(302)

      await expect(
        auth.api.getSession({
          headers: new Headers({
            Cookie: readCookieHeader(response),
          }),
        })
      ).resolves.toMatchObject({
        user: {
          name: "글쓰기 탐험가",
        },
      })
      expect(
        database.db
          .select({ name: authUsers.name })
          .from(authUsers)
          .where(eq(authUsers.id, "user-1"))
          .get()
      ).toEqual({
        name: "글쓰기 탐험가",
      })
    } finally {
      database.close()
    }
  })

  it("HTTPS 인증 응답은 Secure·HttpOnly·SameSite cookie를 발급한다", async () => {
    const database = createMigratedTestDatabase()
    const secureAuthBaseUrl = "https://api.example.test"
    const secureWebOrigin = "https://app.example.test"

    try {
      const auth = createLearnerAuth({
        authBaseUrl: secureAuthBaseUrl,
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret: "x".repeat(32),
        testAuthEnabled: true,
        webOrigin: secureWebOrigin,
      })
      const response = await auth.handler(
        new Request(`${secureAuthBaseUrl}/api/auth/test/sign-in`, {
          headers: { Origin: secureWebOrigin },
        })
      )
      const setCookie = response.headers.get("set-cookie") ?? ""

      expect(setCookie).toContain(`${learnerSessionCookieName}=`)
      expect(setCookie).toMatch(/;\s*Secure/iu)
      expect(setCookie).toMatch(/;\s*HttpOnly/iu)
      expect(setCookie).toMatch(/;\s*SameSite=Lax/iu)
    } finally {
      database.close()
    }
  })

  it("외부 callbackURL은 학습자 앱 기본 경로로 되돌린다", async () => {
    const database = createMigratedTestDatabase()

    try {
      const auth = createLearnerAuth({
        authBaseUrl,
        db: database.db,
        profileRepository: createTestLearnerProfileRepository(),
        secret: "x".repeat(32),
        testAuthEnabled: true,
        webOrigin,
      })
      const response = await auth.handler(
        new Request(
          `${authBaseUrl}/api/auth/test/sign-in?callbackURL=${encodeURIComponent(
            "https://example.com/app/courses"
          )}`
        )
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("location")).toBe(`${webOrigin}/app`)
    } finally {
      database.close()
    }
  })
})

function createMigratedTestDatabase() {
  const database = createInMemoryWritingAppDatabase()

  runBaselineMigration(database.sqlite)

  return database
}

function readCookieHeader(response: Response): string {
  const setCookie = response.headers.get("set-cookie")

  expect(setCookie).not.toBeNull()

  return (
    setCookie
      ?.split(/,(?=\s*[^;,\s]+=)/)
      .map((cookie) => cookie.split(";")[0])
      .join("; ") ?? ""
  )
}

function createTestLearnerProfileRepository(): LearnerProfileRepository {
  return {
    async ensureActiveProfile() {},
    async findProfileByUserId() {
      return null
    },
  }
}
