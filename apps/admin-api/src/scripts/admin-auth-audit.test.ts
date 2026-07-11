import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createAdminAuth, createAdminSessionResolver } from "@/auth/admin-auth"
import { createTestAdminApiDependencies } from "@/routes/test-dependencies"
import { auditAdminAuth } from "@/scripts/admin-auth-audit"
import {
  requireAdminSessionRevocationApproval,
  revokeAllAdminSessions,
} from "@/scripts/revoke-admin-sessions"
import { seedAdminUser } from "@/scripts/seed-admin"
import { adminRoles } from "@workspace/core/admin"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
} from "@workspace/db/schema"

describe("관리자 인증 보안 감사", () => {
  it("익명 fixture에서 승인·미승인·role 불일치를 분류하고 비밀값을 출력하지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const now = new Date("2026-07-12T00:00:00.000Z")

    try {
      runBaselineMigration(database.sqlite)
      await database.db.insert(adminAuthUsers).values([
        {
          createdAt: now,
          email: "approved@example.test",
          emailVerified: true,
          id: "approved",
          name: "승인 관리자",
          role: adminRoles.owner,
          updatedAt: now,
        },
        {
          createdAt: now,
          email: "rogue@example.test",
          emailVerified: true,
          id: "rogue",
          name: "미승인 관리자",
          role: adminRoles.operator,
          updatedAt: now,
        },
      ])
      await database.db.insert(adminAuthAccounts).values({
        accountId: "rogue",
        createdAt: now,
        id: "rogue-credential",
        password: "secret-password-hash",
        providerId: "credential",
        updatedAt: now,
        userId: "rogue",
      })
      await database.db.insert(adminAuthSessions).values({
        createdAt: now,
        expiresAt: new Date("2026-07-13T00:00:00.000Z"),
        id: "rogue-session",
        token: "secret-session-token",
        updatedAt: now,
        userId: "rogue",
      })

      const report = await auditAdminAuth(
        database.db,
        [
          { email: "approved@example.test", role: adminRoles.operator },
          { email: "missing@example.test", role: adminRoles.owner },
        ],
        now
      )
      const serializedReport = JSON.stringify(report)

      expect(report.inventory).toEqual([
        expect.objectContaining({
          email: "approved@example.test",
          status: "role_mismatch",
        }),
        expect.objectContaining({
          activeSessionCount: 1,
          email: "rogue@example.test",
          status: "unapproved",
        }),
      ])
      expect(report.missingApprovedAdmins).toEqual([
        { email: "missing@example.test", role: adminRoles.owner },
      ])
      expect(serializedReport).not.toContain("secret-password-hash")
      expect(serializedReport).not.toContain("secret-session-token")
    } finally {
      database.close()
    }
  })

  it("전체 세션 폐기 후 기존 cookie의 보호 route 접근을 401로 거부한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "owner@example.test",
        name: "소유자",
        now: new Date("2026-07-12T00:00:00.000Z"),
        password: "Strong-admin-123!",
      })
      const auth = createAdminAuth({
        authBaseUrl: "http://localhost:4001",
        db: database.db,
        secret: "x".repeat(32),
        webOrigin: "http://localhost:3001",
      })
      const signInResponse = await auth.handler(
        new Request("http://localhost:4001/api/auth/sign-in/email", {
          body: JSON.stringify({
            email: "owner@example.test",
            password: "Strong-admin-123!",
          }),
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3001",
          },
          method: "POST",
        })
      )
      const sessionCookie = signInResponse.headers
        .get("set-cookie")
        ?.match(/admin_session_token=[^;]+/)?.[0]
      expect(sessionCookie).toBeDefined()

      const sessionResolver = createAdminSessionResolver(auth)
      const app = createApp(createTestAdminApiDependencies({ sessionResolver }))
      const activeResponse = await app.request("/session", {
        headers: { Cookie: sessionCookie ?? "" },
      })
      expect(activeResponse.status).toBe(200)

      expect(revokeAllAdminSessions(database.db)).toBe(1)

      const revokedResponse = await app.request("/session", {
        headers: { Cookie: sessionCookie ?? "" },
      })
      expect(revokedResponse.status).toBe(401)
    } finally {
      database.close()
    }
  })

  it("세션 폐기 명령은 승인과 대상 DB 일치를 요구한다", () => {
    expect(() =>
      requireAdminSessionRevocationApproval(
        "file:/production/admin.sqlite",
        "file:/production/admin.sqlite",
        undefined
      )
    ).toThrow("ADMIN_SESSION_REVOCATION_APPROVED")
    expect(() =>
      requireAdminSessionRevocationApproval(
        "file:/production/admin.sqlite",
        "file:/other/admin.sqlite",
        "true"
      )
    ).toThrow("확인값")
  })
})
