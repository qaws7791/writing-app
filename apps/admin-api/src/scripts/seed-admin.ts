import { hashPassword } from "better-auth/crypto"
import { and, eq } from "drizzle-orm"

import { adminAccount, adminUser } from "@workspace/db/schema"

import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"

type AdminUserInsert = typeof adminUser.$inferInsert
type AdminAccountInsert = typeof adminAccount.$inferInsert
type AdminUserEmailFilter = {
  where(
    user: typeof adminUser,
    operators: {
      eq(left: typeof adminUser.email, right: string): unknown
    }
  ): unknown
}
type AdminAccountUpdate = Partial<
  Pick<AdminAccountInsert, "password" | "updatedAt">
>
type SqliteDatabase = {
  close(): void
  exec(sql: string): unknown
}
type SqliteDatabaseConstructor = new (
  filename: string,
  options: { create: boolean }
) => SqliteDatabase
type AdminDbRuntime = {
  createDatabase(sqlite: SqliteDatabase): AdminSeedDatabase
  runContentMigration(sqlite: SqliteDatabase): void
}

export interface AdminSeedDatabase {
  query: {
    adminUser: {
      findFirst(
        input: AdminUserEmailFilter
      ): Promise<{ id: string } | undefined>
    }
  }
  transaction<T>(
    callback: (tx: {
      insert(table: typeof adminUser): {
        values(value: AdminUserInsert): Promise<unknown>
      }
      insert(table: typeof adminAccount): {
        values(value: AdminAccountInsert): Promise<unknown>
      }
      update(table: typeof adminAccount): {
        set(value: AdminAccountUpdate): {
          where(condition: unknown): Promise<unknown>
        }
      }
    }) => Promise<T>
  ): Promise<T>
}

export type SeedAdminUserResult =
  | {
      status: "created"
    }
  | {
      status: "already-exists"
    }
  | {
      status: "password-updated"
    }

interface SeedAdminUserInput {
  email: string
  name: string
  password: string
  resetExistingPassword?: boolean
}

export async function seedAdminUser(
  db: AdminSeedDatabase,
  input: SeedAdminUserInput
): Promise<SeedAdminUserResult> {
  const normalizedEmail = input.email.toLowerCase()
  const existingUser = await db.query.adminUser.findFirst({
    where: (user, { eq }) => eq(user.email, normalizedEmail),
  })

  if (existingUser && !input.resetExistingPassword) {
    return { status: "already-exists" }
  }

  const now = new Date()
  const passwordHash = await hashPassword(input.password)

  if (existingUser) {
    await db.transaction(async (tx) => {
      await tx
        .update(adminAccount)
        .set({
          password: passwordHash,
          updatedAt: now,
        })
        .where(
          and(
            eq(adminAccount.userId, existingUser.id),
            eq(adminAccount.providerId, "credential")
          )
        )
    })

    return { status: "password-updated" }
  }

  const userId = crypto.randomUUID()

  await db.transaction(async (tx) => {
    await tx.insert(adminUser).values({
      createdAt: now,
      email: normalizedEmail,
      emailVerified: true,
      id: userId,
      name: input.name,
      updatedAt: now,
    })

    await tx.insert(adminAccount).values({
      accountId: userId,
      createdAt: now,
      id: crypto.randomUUID(),
      password: passwordHash,
      providerId: "credential",
      updatedAt: now,
      userId,
    })
  })

  return { status: "created" }
}

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

async function runSeedAdminScript() {
  const sqliteModuleName = "bun:sqlite"
  const { default: Database } = (await import(
    /* @vite-ignore */
    sqliteModuleName
  )) as { default: SqliteDatabaseConstructor }
  const dbModuleName = "@workspace/db"
  const { createDatabase, runContentMigration } = (await import(
    /* @vite-ignore */
    dbModuleName
  )) as AdminDbRuntime
  const env = parseAdminApiEnv(Bun.env)

  ensureDatabaseDirectory(env.databasePath)
  const sqlite = new Database(env.databasePath, { create: true })
  try {
    runContentMigration(sqlite)

    const result = await seedAdminUser(createDatabase(sqlite), {
      email: parseRequiredSeedValue(Bun.env, "ADMIN_SEED_EMAIL"),
      name: Bun.env["ADMIN_SEED_NAME"] || "관리자",
      password: parseRequiredSeedValue(Bun.env, "ADMIN_SEED_PASSWORD"),
      resetExistingPassword: Bun.env["ADMIN_SEED_RESET_PASSWORD"] === "true",
    })

    // eslint-disable-next-line no-console
    console.info(JSON.stringify(result))
  } finally {
    sqlite.close()
  }
}

if (import.meta.main) {
  await runSeedAdminScript()
}
