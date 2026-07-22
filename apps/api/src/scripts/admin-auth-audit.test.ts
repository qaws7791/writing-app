import { describe, expect, it } from "vitest"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminRoles } from "@workspace/identity/admin-actor"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { seedAdminIdentity } from "@workspace/identity/seed"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
} from "@workspace/auth/schema"

import { runApplicationMigrations } from "@/db/migrate"
import { auditAdminAuth } from "@/scripts/admin-auth-audit"
import {
  requireAdminSessionRevocationApproval,
  revokeAllAdminSessions,
} from "@/scripts/revoke-admin-sessions"

describe("통합 API 관리자 인증 운영 명령", () => {
  it("승인 불일치와 미승인 계정을 분류하되 credential 비밀값은 출력하지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const now = new Date("2026-07-12T00:00:00.000Z")
    try {
      runApplicationMigrations(database.sqlite)
      await database.db.insert(adminAuthUsers).values([
        {
          createdAt: now,
          email: "approved@example.test",
          emailVerified: true,
          id: "approved",
          name: "승인 관리자",
          updatedAt: now,
        },
        {
          createdAt: now,
          email: "rogue@example.test",
          emailVerified: true,
          id: "rogue",
          name: "미승인 관리자",
          updatedAt: now,
        },
      ])
      seedAdminIdentity(database.db, {
        adminId: adminIdSchema.parse("approved"),
        role: adminRoles.owner,
      })
      seedAdminIdentity(database.db, {
        adminId: adminIdSchema.parse("rogue"),
        role: adminRoles.operator,
      })
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
      expect(JSON.stringify(report)).not.toContain("secret-password-hash")
      expect(JSON.stringify(report)).not.toContain("secret-session-token")
    } finally {
      database.close()
    }
  })

  it("세션 전체 폐기와 실행 승인을 강제한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runApplicationMigrations(database.sqlite)
      const now = new Date("2026-07-12T00:00:00.000Z")
      await database.db.insert(adminAuthUsers).values({
        createdAt: now,
        email: "owner@example.test",
        emailVerified: true,
        id: "owner",
        name: "소유자",
        updatedAt: now,
      })
      await database.db.insert(adminAuthSessions).values({
        createdAt: now,
        expiresAt: new Date("2026-07-13T00:00:00.000Z"),
        id: "session",
        token: "token",
        updatedAt: now,
        userId: "owner",
      })
      expect(revokeAllAdminSessions(database.db)).toBe(1)
      await expect(
        database.db.select().from(adminAuthSessions)
      ).resolves.toEqual([])
    } finally {
      database.close()
    }

    expect(() =>
      requireAdminSessionRevocationApproval(
        "file:/production/api.sqlite",
        "file:/production/api.sqlite",
        undefined
      )
    ).toThrow("ADMIN_SESSION_REVOCATION_APPROVED")
    expect(() =>
      requireAdminSessionRevocationApproval(
        "file:/production/api.sqlite",
        "file:/other/api.sqlite",
        "true"
      )
    ).toThrow("확인값")
  })
})
