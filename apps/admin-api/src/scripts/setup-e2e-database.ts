import { hashPassword } from "better-auth/crypto"
import {
  adminAuthAccounts,
  adminAuthUsers,
  createWritingAppDatabase,
} from "@workspace/db"

const e2eDatabaseUrl = process.env["DATABASE_URL"]
const adminPassword = "e2e-password-123"

if (process.env["NODE_ENV"] !== "test" || e2eDatabaseUrl === undefined) {
  throw new Error("E2E 관리자 fixture에는 NODE_ENV=test가 필요합니다.")
}

await seedE2eAdmins(e2eDatabaseUrl)

async function seedE2eAdmins(databaseUrl: string): Promise<void> {
  const database = createWritingAppDatabase(databaseUrl)

  try {
    const now = new Date("2026-07-12T00:00:00.000Z")
    const password = await hashPassword(adminPassword)
    const admins = [
      {
        email: "owner@example.test",
        id: "e2e-owner",
        name: "E2E 소유자",
        role: "owner",
      },
      {
        email: "operator@example.test",
        id: "e2e-operator",
        name: "E2E 운영자",
        role: "operator",
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
  } finally {
    database.close()
  }
}
