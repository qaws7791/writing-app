import Database from "bun:sqlite"
import { and, eq } from "drizzle-orm"

import { configureSqliteConnection, createDatabase } from "@workspace/db/client"
import { runContentMigration } from "@workspace/db/migrations/run-content-migration"
import { adminAccount, adminUser } from "@workspace/db/schema"

import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"
import {
  type AdminSeedDatabase,
  seedAdminUser,
} from "@/scripts/seed-admin-user"

type AdminDatabase = ReturnType<typeof createDatabase>

function parseRequiredSeedValue(
  env: Record<string, string | undefined>,
  name: "ADMIN_SEED_EMAIL" | "ADMIN_SEED_PASSWORD"
) {
  const value = env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function createAdminSeedDatabase(db: AdminDatabase): AdminSeedDatabase {
  return {
    async createAdminUserWithCredential(input) {
      await db.transaction(async (tx) => {
        await tx.insert(adminUser).values({
          createdAt: input.createdAt,
          email: input.email,
          emailVerified: true,
          id: input.userId,
          name: input.name,
          updatedAt: input.updatedAt,
        })

        await tx.insert(adminAccount).values({
          accountId: input.userId,
          createdAt: input.createdAt,
          id: input.accountId,
          password: input.passwordHash,
          providerId: "credential",
          updatedAt: input.updatedAt,
          userId: input.userId,
        })
      })
    },
    async findAdminUserByEmail(email) {
      return db.query.adminUser.findFirst({
        columns: {
          id: true,
        },
        where: (user, { eq }) => eq(user.email, email),
      })
    },
    async updateCredentialPassword(input) {
      await db.transaction(async (tx) => {
        await tx
          .update(adminAccount)
          .set({
            password: input.passwordHash,
            updatedAt: input.updatedAt,
          })
          .where(
            and(
              eq(adminAccount.userId, input.userId),
              eq(adminAccount.providerId, "credential")
            )
          )
      })
    },
  }
}

async function runSeedAdminScript() {
  const env = parseAdminApiEnv(Bun.env)

  ensureDatabaseDirectory(env.databasePath)
  const sqlite = new Database(env.databasePath, { create: true })
  try {
    configureSqliteConnection(sqlite)
    runContentMigration(sqlite)

    const result = await seedAdminUser(
      createAdminSeedDatabase(createDatabase(sqlite)),
      {
        email: parseRequiredSeedValue(Bun.env, "ADMIN_SEED_EMAIL"),
        name: Bun.env["ADMIN_SEED_NAME"] || "관리자",
        password: parseRequiredSeedValue(Bun.env, "ADMIN_SEED_PASSWORD"),
        resetExistingPassword: Bun.env["ADMIN_SEED_RESET_PASSWORD"] === "true",
      }
    )

    // eslint-disable-next-line no-console
    console.info(JSON.stringify(result))
  } finally {
    sqlite.close()
  }
}

if (import.meta.main) {
  await runSeedAdminScript()
}
