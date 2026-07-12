import { describe, expect, it } from "vitest"
import { hashPassword } from "better-auth/crypto"

import { createAdminMfaRecoveryService } from "@/auth/admin-mfa-recovery"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { adminIdSchema } from "@workspace/contracts/admin"

const now = new Date("2026-07-12T00:00:00.000Z")

describe("관리자 MFA 복구", () => {
  it("복구 코드 원문을 저장하지 않고 한 번만 사용한 뒤 모든 세션을 폐기한다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      await seedMfaOwner(database)
      const service = createAdminMfaRecoveryService({
        database,
        now: () => now,
      })

      const recoveryCodes = await service.replaceRecoveryCodes(
        adminIdSchema.parse("owner-1")
      )
      const storedCodes = database.sqlite
        .query<{ readonly codeHash: string }, []>(
          "SELECT code_hash AS codeHash FROM admin_mfa_recovery_code"
        )
        .all()

      expect(recoveryCodes).toHaveLength(10)
      expect(storedCodes).toHaveLength(10)
      expect(storedCodes.map((row) => row.codeHash)).not.toContain(
        recoveryCodes[0]
      )

      const input = {
        code: recoveryCodes[0] ?? "",
        email: "owner@example.com",
        password: "owner-password-123",
      }
      await expect(service.recover(input)).resolves.toBe(true)
      await expect(service.recover(input)).resolves.toBe(false)

      expect(
        database.sqlite.query("SELECT * FROM admin_session").all()
      ).toEqual([])
      expect(
        database.sqlite.query("SELECT * FROM admin_two_factor").all()
      ).toEqual([])
      expect(
        database.sqlite
          .query<{ readonly enabled: number }, []>(
            "SELECT two_factor_enabled AS enabled FROM admin_user"
          )
          .get()?.enabled
      ).toBe(0)
    } finally {
      database.close()
    }
  })
})

async function seedMfaOwner(
  database: ReturnType<typeof createInMemoryWritingAppDatabase>
): Promise<void> {
  const timestamp = now.getTime()
  const password = await hashPassword("owner-password-123")

  database.sqlite
    .query(
      `INSERT INTO admin_user
        (id, name, email, email_verified, image, role, two_factor_enabled, created_at, updated_at)
       VALUES (?, ?, ?, 1, NULL, 'owner', 1, ?, ?)`
    )
    .run("owner-1", "소유자", "owner@example.com", timestamp, timestamp)
  database.sqlite
    .query(
      `INSERT INTO admin_account
        (id, user_id, account_id, provider_id, password, created_at, updated_at)
       VALUES (?, ?, ?, 'credential', ?, ?, ?)`
    )
    .run("account-1", "owner-1", "owner-1", password, timestamp, timestamp)
  database.sqlite
    .query(
      `INSERT INTO admin_two_factor
        (id, user_id, secret, backup_codes, verified, failed_verification_count)
       VALUES (?, ?, ?, ?, 1, 0)`
    )
    .run("mfa-1", "owner-1", "encrypted-secret", "[]")
  database.sqlite
    .query(
      `INSERT INTO admin_session
        (id, user_id, token, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      "session-1",
      "owner-1",
      "session-token",
      timestamp + 60_000,
      timestamp,
      timestamp
    )
}
