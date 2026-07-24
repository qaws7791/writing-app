import { hashAuthPassword } from "@workspace/auth/password"
import {
  adminAuthAccounts,
  adminAuthUsers,
  authAccounts,
} from "@workspace/auth/schema"
import { createWritingAppDatabase } from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"

const adminPassword = "e2e-password-123"
const learnerPassword = "e2e-password-123"

if (import.meta.main) {
  const e2eDatabaseUrl = process.env["DATABASE_URL"]
  if (process.env["NODE_ENV"] !== "test" || e2eDatabaseUrl === undefined) {
    throw new Error("E2E 인증 fixture에는 NODE_ENV=test가 필요합니다.")
  }
  await setupE2eAuthDatabase(e2eDatabaseUrl)
}

export async function setupE2eAuthDatabase(databaseUrl: string): Promise<void> {
  const database = createWritingAppDatabase(databaseUrl)
  try {
    runApplicationMigrations(database.sqlite)
    const now = new Date("2026-07-12T00:00:00.000Z")
    const password = await hashAuthPassword(adminPassword)
    const admins = [
      {
        email: "owner@example.test",
        id: "e2e-owner",
        name: "E2E 소유자",
      },
    ] as const

    await database.db.insert(adminAuthUsers).values(
      admins.map((admin) => ({
        ...admin,
        createdAt: now,
        emailVerified: true,
        image: null,
        updatedAt: now,
      }))
    )
    await database.db.insert(adminAuthAccounts).values(
      admins.map((admin) => ({
        accountId: admin.id,
        createdAt: now,
        id: `${admin.id}-credential`,
        password,
        providerId: "credential",
        updatedAt: now,
        userId: admin.id,
      }))
    )
    await database.db.insert(authAccounts).values({
      accountId: "user-1",
      createdAt: now,
      id: "e2e-learner-credential",
      password: await hashAuthPassword(learnerPassword),
      providerId: "credential",
      updatedAt: now,
      userId: "user-1",
    })
  } finally {
    database.close()
  }
}
