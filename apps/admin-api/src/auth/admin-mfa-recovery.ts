import { hashPassword, verifyPassword } from "better-auth/crypto"

import type { WritingAppDatabaseClient } from "@workspace/db/client"
import { adminIdSchema, type AdminId } from "@workspace/contracts/admin"

const recoveryCodeCount = 10

export type AdminMfaRecoveryService = ReturnType<
  typeof createAdminMfaRecoveryService
>

export function createAdminMfaRecoveryService({
  database,
  now = () => new Date(),
}: {
  readonly database: WritingAppDatabaseClient
  readonly now?: () => Date
}) {
  return {
    async replaceRecoveryCodes(adminId: AdminId): Promise<readonly string[]> {
      const codes = Array.from({ length: recoveryCodeCount }, () =>
        createRecoveryCode()
      )
      const hashes = await Promise.all(codes.map(hashRecoveryCode))
      const createdAt = now().getTime()

      database.sqlite.transaction(() => {
        database.sqlite
          .query("DELETE FROM admin_mfa_recovery_code WHERE user_id = ?")
          .run(adminId)

        const insert = database.sqlite.query(
          `INSERT INTO admin_mfa_recovery_code
            (id, user_id, code_hash, created_at, used_at)
           VALUES (?, ?, ?, ?, NULL)`
        )
        hashes.forEach((codeHash) => {
          insert.run(crypto.randomUUID(), adminId, codeHash, createdAt)
        })
      })()

      return codes
    },

    async recover(input: {
      readonly code: string
      readonly email: string
      readonly password: string
    }): Promise<boolean> {
      const account = database.sqlite
        .query<
          {
            readonly password: string | null
            readonly userId: string
          },
          [string]
        >(
          `SELECT admin_account.password AS password, admin_user.id AS userId
           FROM admin_user
           JOIN admin_account ON admin_account.user_id = admin_user.id
           WHERE lower(admin_user.email) = lower(?)
             AND admin_account.provider_id = 'credential'
           LIMIT 1`
        )
        .get(input.email)

      if (account?.password === null || account === null) {
        const dummyHash = await hashPassword(crypto.randomUUID())
        await verifyPassword({ hash: dummyHash, password: input.password })
        return false
      }
      const adminId = adminIdSchema.safeParse(account.userId)
      if (!adminId.success) return false

      const passwordMatches = await verifyPassword({
        hash: account.password,
        password: input.password,
      })
      if (!passwordMatches) return false

      const codeHash = await hashRecoveryCode(input.code)
      const usedAt = now().getTime()

      return database.sqlite.transaction(() => {
        const consumedRecoveryCode = database.sqlite
          .query<{ readonly id: string }, [number, string, string]>(
            `UPDATE admin_mfa_recovery_code
             SET used_at = ?
             WHERE user_id = ? AND code_hash = ? AND used_at IS NULL
             RETURNING id`
          )
          .get(usedAt, adminId.data, codeHash)

        if (consumedRecoveryCode === null) return false

        database.sqlite
          .query("UPDATE admin_user SET two_factor_enabled = 0 WHERE id = ?")
          .run(adminId.data)
        database.sqlite
          .query("DELETE FROM admin_two_factor WHERE user_id = ?")
          .run(adminId.data)
        database.sqlite
          .query("DELETE FROM admin_session WHERE user_id = ?")
          .run(adminId.data)

        return true
      })()
    },
  }
}

function createRecoveryCode(): string {
  const value = crypto.randomUUID().replaceAll("-", "").toUpperCase()
  return [0, 8, 16, 24].map((start) => value.slice(start, start + 8)).join("-")
}

async function hashRecoveryCode(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase()
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Buffer.from(digest).toString("hex")
}
