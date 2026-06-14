import { createKwepDatabase, getDefaultDatabaseUrl } from "@workspace/db/client"
import { adminAuthUsers, type KwepDatabase } from "@workspace/db"

import {
  createSeedAdminUserRow,
  type SeedAdminUserInput,
} from "@/scripts/seed-admin-user"

export function seedAdminUser(
  db: KwepDatabase,
  input: SeedAdminUserInput
): void {
  const row = createSeedAdminUserRow(input)

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
}

if (import.meta.main) {
  const client = createKwepDatabase(
    process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
  )

  try {
    seedAdminUser(client.db, {
      email: process.env["ADMIN_SEED_EMAIL"] ?? "admin@example.com",
      name: process.env["ADMIN_SEED_NAME"] ?? "관리자",
      now: new Date(),
    })
  } finally {
    client.close()
  }
}
