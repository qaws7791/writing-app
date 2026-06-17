import { createKwepDatabase, getDefaultDatabaseUrl } from "@workspace/db/client"
import {
  adminAuthAccounts,
  adminAuthUsers,
  type KwepDatabase,
} from "@workspace/db"
import { hashPassword } from "better-auth/crypto"

import {
  createSeedAdminRows,
  type SeedAdminUserInput,
} from "@/scripts/seed-admin-user"

export function seedAdminUser(
  db: KwepDatabase,
  input: SeedAdminUserInput
): Promise<void> {
  return hashPassword(input.password).then((passwordHash) => {
    const rows = createSeedAdminRows({
      ...input,
      passwordHash,
    })

    db.insert(adminAuthUsers)
      .values(rows.user)
      .onConflictDoUpdate({
        set: {
          email: rows.user.email,
          emailVerified: rows.user.emailVerified,
          image: rows.user.image,
          name: rows.user.name,
          role: rows.user.role,
          updatedAt: rows.user.updatedAt,
        },
        target: adminAuthUsers.id,
      })
      .run()

    if (input.resetPassword === true) {
      db.insert(adminAuthAccounts)
        .values(rows.account)
        .onConflictDoUpdate({
          set: {
            password: rows.account.password,
            updatedAt: rows.account.updatedAt,
          },
          target: adminAuthAccounts.id,
        })
        .run()
      return
    }

    db.insert(adminAuthAccounts)
      .values(rows.account)
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
