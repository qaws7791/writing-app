import { createKwepDatabase, getDefaultDatabaseUrl } from "@workspace/db/client"
import {
  adminAuthAccounts,
  adminAuthUsers,
  type KwepDatabase,
} from "@workspace/db"
import { hashPassword } from "better-auth/crypto"

import {
  createSeedAdminUserRow,
  type SeedAdminUserInput,
} from "@/scripts/seed-admin-user"

export function seedAdminUser(
  db: KwepDatabase,
  input: SeedAdminUserInput
): Promise<void> {
  const row = createSeedAdminUserRow(input)

  return hashPassword(input.password).then((password) => {
    db.insert(adminAuthUsers)
      .values(row)
      .onConflictDoUpdate({
        set: {
          email: row.email,
          emailVerified: true,
          image: null,
          name: row.name,
          role: "owner",
          updatedAt: row.updatedAt,
        },
        target: adminAuthUsers.id,
      })
      .run()

    const accountRow = {
      accessToken: null,
      accessTokenExpiresAt: null,
      accountId: row.id,
      createdAt: row.createdAt,
      id: `${row.id}-credential`,
      idToken: null,
      password,
      providerId: "credential",
      refreshToken: null,
      refreshTokenExpiresAt: null,
      scope: null,
      updatedAt: row.updatedAt,
      userId: row.id,
    }

    if (input.resetPassword === true) {
      db.insert(adminAuthAccounts)
        .values(accountRow)
        .onConflictDoUpdate({
          set: {
            password,
            updatedAt: row.updatedAt,
          },
          target: adminAuthAccounts.id,
        })
        .run()
      return
    }

    db.insert(adminAuthAccounts)
      .values(accountRow)
      .onConflictDoNothing({
        target: adminAuthAccounts.id,
      })
      .run()
  })
}

if (import.meta.main) {
  const client = createKwepDatabase(
    process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
  )

  try {
    await seedAdminUser(client.db, {
      email: process.env["ADMIN_SEED_EMAIL"] ?? "admin@example.com",
      name: process.env["ADMIN_SEED_NAME"] ?? "관리자",
      now: new Date(),
      password:
        process.env["ADMIN_SEED_PASSWORD"] ??
        "replace-with-local-admin-password",
      resetPassword: process.env["ADMIN_SEED_RESET_PASSWORD"] === "true",
    })
  } finally {
    client.close()
  }
}
